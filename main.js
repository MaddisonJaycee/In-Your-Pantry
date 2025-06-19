const SPOONACULAR_KEY = 'e2a8ab23886a406b8d1740eadb21af2b';

let currentPage = 1;
let lastQuery = '';
let lastTotalResults = null;
const RECIPES_PER_PAGE = 16;

// Ingredient chips state
let ingredientList = [];

// Shopping list state (persisted in localStorage)
let shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');

function renderIngredientChips() {
    const chipsDiv = document.getElementById('ingredient-chips');
    chipsDiv.innerHTML = '';
    ingredientList.forEach((ingredient, idx) => {
        const chip = document.createElement('span');
        chip.className = 'ingredient-chip';
        chip.textContent = ingredient;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-chip';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            ingredientList.splice(idx, 1);
            renderIngredientChips();
            // Do NOT fetch recipes here (only on add)
        };
        chip.appendChild(removeBtn);
        chipsDiv.appendChild(chip);
    });
}

function getIngredientQuery() {
    return ingredientList.join(',');
}

function getDietQuery() {
    const dietSelect = document.getElementById('diet-select');
    return dietSelect ? dietSelect.value : '';
}

function getMaxCalories() {
    const calInput = document.getElementById('max-calories');
    return calInput && calInput.value ? parseInt(calInput.value, 10) : null;
}

async function fetchRecipes(page = 1) {
    const resultsDiv = document.getElementById('results');
    const paginationDiv = document.getElementById('pagination');
    // Hide random recipes section when searching
    document.getElementById('random-recipes-section').style.display = 'none';
    resultsDiv.innerHTML = '';
    if (paginationDiv) paginationDiv.innerHTML = '';
    if (!ingredientList.length) {
        resultsDiv.textContent = '';
        showRandomRecipes();
        return;
    }
    lastQuery = getIngredientQuery();
    currentPage = page;
    try {
        const offset = (page - 1) * RECIPES_PER_PAGE;
        let url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${SPOONACULAR_KEY}&ingredients=${encodeURIComponent(lastQuery)}&number=${RECIPES_PER_PAGE}&offset=${offset}&ranking=1&ignorePantry=true`;

        // Add diet and calorie filters
        const diet = getDietQuery();
        const maxCalories = getMaxCalories();
        // For diet, we need to use /complexSearch endpoint, so only use if filters are set
        if (diet || maxCalories) {
            url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_KEY}&includeIngredients=${encodeURIComponent(lastQuery)}&number=${RECIPES_PER_PAGE}&offset=${offset}`;
            if (diet) url += `&diet=${encodeURIComponent(diet)}`;
            if (maxCalories) url += `&maxCalories=${maxCalories}`;
            url += `&addRecipeInformation=true`;
        }

        const res = await fetch(url);
        const data = await res.json();
        let recipes = data;
        // For complexSearch, recipes are in data.results
        if (diet || maxCalories) {
            recipes = data.results || [];
        }
        // Spoonacular does not return totalResults for this endpoint, so we estimate
        // If less than requested, it's the last page
        if (!recipes || recipes.length === 0) {
            resultsDiv.textContent = 'No recipes found.';
            return;
        }
        recipes.forEach(item => {
            const card = document.createElement('div');
            card.className = 'recipe-item';
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title;
            const title = document.createElement('h3');
            title.textContent = item.title;

            // Used/missed ingredients for findByIngredients, otherwise show diets/calories
            let used, missed;
            if (item.usedIngredients && item.missedIngredients) {
                used = document.createElement('p');
                used.innerHTML = `<b>Used:</b> ${item.usedIngredients.map(i => i.name).join(', ') || 'None'}`;
                missed = document.createElement('p');
                missed.innerHTML = `<b>Missing:</b> ${item.missedIngredients.map(i => i.name).join(', ') || 'None'}`;
            } else {
                used = document.createElement('p');
                used.innerHTML = `<b>Diets:</b> ${(item.diets && item.diets.length) ? item.diets.join(', ') : 'None'}`;
                missed = document.createElement('p');
                missed.innerHTML = `<b>Calories:</b> ${item.nutrition && item.nutrition.nutrients ? (item.nutrition.nutrients.find(n => n.name === 'Calories')?.amount + ' kcal') : 'N/A'}`;
            }

            // Container for info (to push button to bottom)
            const infoContainer = document.createElement('div');
            infoContainer.style.display = 'flex';
            infoContainer.style.flexDirection = 'column';
            infoContainer.style.flexGrow = '1';
            infoContainer.appendChild(title);
            infoContainer.appendChild(used);
            infoContainer.appendChild(missed);

            // See Details button
            const btn = document.createElement('button');
            btn.className = 'view-details-btn';
            btn.textContent = 'View Details';
            btn.onclick = async (e) => {
                e.preventDefault();
                await displayRecipe(item.id);
            };

            card.appendChild(img);
            card.appendChild(infoContainer);
            card.appendChild(btn);
            resultsDiv.appendChild(card);
        });

        // Pagination arrows
        let pagination = document.getElementById('pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.id = 'pagination';
            resultsDiv.parentNode.insertBefore(pagination, resultsDiv.nextSibling);
        }
        pagination.innerHTML = '';

        // Previous arrow
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-arrow';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = page === 1;
        prevBtn.onclick = () => fetchRecipes(page - 1);
        pagination.appendChild(prevBtn);

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${page}`;
        pagination.appendChild(pageInfo);

        // Next arrow
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-arrow';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        // If less than RECIPES_PER_PAGE, it's the last page
        nextBtn.disabled = recipes.length < RECIPES_PER_PAGE;
        nextBtn.onclick = () => fetchRecipes(page + 1);
        pagination.appendChild(nextBtn);

    } catch (err) {
        resultsDiv.textContent = 'Error loading recipes.';
        console.error(err);
    }
}

async function displayRecipe(recipeId) {
    const details = document.getElementById('recipe-details');
    let modal = document.getElementById('recipe-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'recipe-modal';
        details.appendChild(modal);
    }
    const content = document.getElementById('recipe-content');
    try {
        const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        // Format ingredients as a list
        const ingredientsList = data.extendedIngredients.map(i => `<li>${i.original}</li>`).join('');
        // Format instructions as HTML
        let instructions = data.instructions || '';
        if (!instructions && data.analyzedInstructions && data.analyzedInstructions.length > 0) {
            instructions = '<ol>' + data.analyzedInstructions[0].steps.map(s => `<li>${s.step}</li>`).join('') + '</ol>';
        }
        if (!instructions) instructions = 'No instructions provided.';

        // Find missing ingredients (not in ingredientList)
        const missingIngredients = data.extendedIngredients
            .filter(i => !ingredientList.includes(i.name.toLowerCase()));

        // Only show one ingredient list, and put the add button below it
        let addMissingBtnHtml = '';
        if (missingIngredients.length > 0) {
            addMissingBtnHtml = `
                <button id="add-all-missing" class="add-to-shopping" style="margin-top:10px;">Add Missing Ingredients to Shopping List</button>
            `;
        } else {
            addMissingBtnHtml = `<p><b>All ingredients are in your pantry!</b></p>`;
        }

        // Add "Go to Recipe Website" button if sourceUrl exists
        let goToRecipeBtnHtml = '';
        if (data.sourceUrl) {
            goToRecipeBtnHtml = `
                <a href="${data.sourceUrl}" target="_blank" rel="noopener noreferrer">
                    <button class="add-to-shopping" style="margin-top:14px; background:linear-gradient(90deg,#ffe082 0%,#ff7043 100%); color:#3e2c1c;">Go to Recipe Website</button>
                </a>
            `;
        }

        content.innerHTML = `
            <h2>${data.title}</h2>
            <img src="${data.image}" alt="${data.title}">
            <p><b>Ingredients:</b></p>
            <ul>${ingredientsList}</ul>
            ${addMissingBtnHtml}
            ${goToRecipeBtnHtml}
            <p><b>Instructions:</b></p>
            <div>${instructions}</div>
        `;
        details.style.display = 'flex';
        // Prevent background scroll when modal is open
        document.body.style.overflow = 'hidden';

        // Attach event listener to "Add All Missing" button
        const addAllBtn = document.getElementById('add-all-missing');
        if (addAllBtn) {
            addAllBtn.addEventListener('click', function() {
                missingIngredients.forEach(i => addToShoppingList(i.name));
                addAllBtn.disabled = true;
                addAllBtn.textContent = 'All Added!';
            });
        }

    } catch (err) {
        content.innerHTML = 'Could not load recipe details.';
        console.error(err);
    }
}

function closeRecipeDetails() {
    document.getElementById('recipe-details').style.display = 'none';
    // Restore background scroll when modal is closed
    document.body.style.overflow = '';
}

// Add this function to fetch ingredient suggestions from Spoonacular
async function fetchIngredientSuggestions(query) {
    if (!query) return [];
    try {
        const url = `https://api.spoonacular.com/food/ingredients/autocomplete?apiKey=${SPOONACULAR_KEY}&query=${encodeURIComponent(query)}&number=8`;
        const res = await fetch(url);
        const suggestions = await res.json();
        return suggestions.map(s => s.name);
    } catch (err) {
        return [];
    }
}

// Show random recipes if no ingredients are entered
async function showRandomRecipes() {
    const section = document.getElementById('random-recipes-section');
    const container = document.getElementById('random-recipes');
    section.style.display = 'block';
    container.innerHTML = '';
    try {
        // Spoonacular allows up to 10 random recipes per call
        const url = `https://api.spoonacular.com/recipes/random?apiKey=${SPOONACULAR_KEY}&number=4`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.recipes || data.recipes.length === 0) {
            container.textContent = 'No random recipes available.';
            return;
        }
        data.recipes.forEach(item => {
            const card = document.createElement('div');
            card.className = 'recipe-item';
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title;
            const title = document.createElement('h3');
            title.textContent = item.title;

            // Diets and calories (if available)
            const diets = document.createElement('p');
            diets.innerHTML = `<b>Diets:</b> ${(item.diets && item.diets.length) ? item.diets.join(', ') : 'None'}`;
            const calories = document.createElement('p');
            calories.innerHTML = `<b>Calories:</b> ${
                item.nutrition && item.nutrition.nutrients
                ? (item.nutrition.nutrients.find(n => n.name === 'Calories')?.amount + ' kcal')
                : 'N/A'
            }`;

            // Container for info
            const infoContainer = document.createElement('div');
            infoContainer.style.display = 'flex';
            infoContainer.style.flexDirection = 'column';
            infoContainer.style.flexGrow = '1';
            infoContainer.appendChild(title);
            infoContainer.appendChild(diets);
            infoContainer.appendChild(calories);

            // See Details button
            const btn = document.createElement('button');
            btn.className = 'view-details-btn';
            btn.textContent = 'View Details';
            btn.onclick = async (e) => {
                e.preventDefault();
                await displayRecipe(item.id);
            };

            card.appendChild(img);
            card.appendChild(infoContainer);
            card.appendChild(btn);
            container.appendChild(card);
        });
    } catch (err) {
        container.textContent = 'Error loading random recipes.';
        console.error(err);
    }
}

// Attach new function to button
window.searchRecipes = () => fetchRecipes(1);
window.closeRecipeDetails = closeRecipeDetails;

// Ingredient input logic
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('ingredient-input');
    const datalist = document.getElementById('ingredient-suggestions');
    renderIngredientChips();
    // Show random recipes on load
    if (!ingredientList.length) {
        showRandomRecipes();
    }
    // Listen for input events to fetch suggestions
    input.addEventListener('input', async function(e) {
        const value = input.value.trim();
        if (value.length > 0) {
            const suggestions = await fetchIngredientSuggestions(value);
            datalist.innerHTML = '';
            suggestions.forEach(s => {
                const option = document.createElement('option');
                option.value = s;
                datalist.appendChild(option);
            });
        } else {
            datalist.innerHTML = '';
        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
            e.preventDefault();
            const value = input.value.trim();
            if (value && !ingredientList.includes(value.toLowerCase())) {
                ingredientList.push(value.toLowerCase());
                renderIngredientChips();
                fetchRecipes(1); // Fetch recipes on add
            }
            input.value = '';
            datalist.innerHTML = '';
        } else if (e.key === 'Backspace' && input.value === '') {
            // Remove last chip if input is empty and backspace is pressed
            ingredientList.pop();
            renderIngredientChips();
            // Do NOT fetch recipes here (only on add)
        }
    });

    input.addEventListener('blur', function() {
        // Add chip on blur if input has value
        const value = input.value.trim();
        if (value && !ingredientList.includes(value.toLowerCase())) {
            ingredientList.push(value.toLowerCase());
            renderIngredientChips();
            fetchRecipes(1); // Fetch recipes on add
        }
        input.value = '';
        datalist.innerHTML = '';
    });

    // Shopping list modal events
    document.getElementById('show-shopping-list').addEventListener('click', showShoppingListModal);
    document.getElementById('close-shopping-list').addEventListener('click', closeShoppingListModal);

    // Use .circle-btn for both buttons
    document.getElementById('search-button').classList.add('circle-btn');
    document.getElementById('show-shopping-list').classList.add('circle-btn');
});

// Shopping list functions
function addToShoppingList(ingredient) {
    if (!shoppingList.includes(ingredient)) {
        shoppingList.push(ingredient);
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
        renderShoppingList();
    }
}

function renderShoppingList() {
    const modal = document.getElementById('shopping-list-modal');
    const content = document.getElementById('shopping-list-content');
    if (!content) return;
    if (shoppingList.length === 0) {
        content.innerHTML = '<p>Your shopping list is empty.</p>';
    } else {
        content.innerHTML = `
            <ul style="padding-left:0; list-style:none; margin:0;">
                ${shoppingList.map((item, idx) =>
                    `<li style="display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f0f0;">
                        <span>${item}</span>
                        <button class="remove-chip" style="font-size:1.1rem; margin-left:18px;" onclick="removeFromShoppingList(${idx})">&times;</button>
                    </li>`
                ).join('')}
            </ul>
        `;
    }
}

function showShoppingListModal() {
    renderShoppingList();
    document.getElementById('shopping-list-modal').style.display = 'flex';
}

function closeShoppingListModal() {
    document.getElementById('shopping-list-modal').style.display = 'none';
}

function removeFromShoppingList(idx) {
    shoppingList.splice(idx, 1);
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    renderShoppingList();
}