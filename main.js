const SPOONACULAR_KEY = '714d35d22379414698767ca0b6b0d48e';

let currentPage = 1;
let lastQuery = '';
let lastTotalResults = null;
const RECIPES_PER_PAGE = 16;

let ingredientList = [];
let shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');

function renderIngredientChips() {
    const displayDiv = document.getElementById('ingredient-list-display');
    if (displayDiv) {
        if (ingredientList.length) {
            displayDiv.innerHTML = `<b>Ingredients added:</b>
                <ul class="ingredient-list-ul">
                    ${ingredientList.map((ing, idx) =>
                        `<li class="ingredient-chip">${ing}<button class="remove-chip" onclick="removeIngredient(${idx})">&times;</button></li>`
                    ).join('')}
                </ul>`;
        } else {
            displayDiv.innerHTML = '';
        }
    }
}

window.removeIngredient = function(idx) {
    ingredientList.splice(idx, 1);
    renderIngredientChips();
    fetchRecipes(1);
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

let allLoaded = false;

async function fetchRecipes(page = 1, append = false) {
    const resultsDiv = document.getElementById('results');
    const paginationDiv = document.getElementById('pagination');
    document.getElementById('random-recipes-section').style.display = 'none';
    if (!append) resultsDiv.innerHTML = '';
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
        const diet = getDietQuery();
        const maxCalories = getMaxCalories();

        let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_KEY}&includeIngredients=${encodeURIComponent(lastQuery)}&number=${RECIPES_PER_PAGE}&offset=${offset}&addRecipeInformation=true`;
        if (diet) url += `&diet=${encodeURIComponent(diet)}`;
        if (maxCalories) url += `&maxCalories=${maxCalories}`;

        const res = await fetch(url);
        const data = await res.json();
        let recipes = data.results || [];
        if (!recipes || recipes.length === 0) {
            if (!append) resultsDiv.textContent = 'No recipes found.';
            allLoaded = true;
            return;
        }
        recipes.forEach(item => {
            const card = document.createElement('div');
            card.className = 'recipe-item';
            card.style.height = '420px';
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title;
            const title = document.createElement('h3');
            title.textContent = item.title;
            title.style.wordBreak = 'break-word';
            title.style.overflow = 'hidden';
            title.style.textOverflow = 'ellipsis';
            title.style.maxWidth = '95%';

            let used, missed;
            if (item.usedIngredients && item.missedIngredients) {
                used = document.createElement('p');
                used.className = 'recipe-info';
                used.innerHTML = `<b>Used:</b> ${item.usedIngredients.map(i => i.name).join(', ') || 'None'}`;
                missed = document.createElement('p');
                missed.className = 'recipe-info';
                missed.innerHTML = `<b>Missing:</b> ${item.missedIngredients.map(i => i.name).join(', ') || 'None'}`;
            } else {
                used = document.createElement('p');
                used.className = 'recipe-info';
                used.innerHTML = `<b>Diets:</b> ${(item.diets && item.diets.length) ? item.diets.join(', ') : 'None'}`;
                missed = document.createElement('p');
                missed.className = 'recipe-info';
                missed.innerHTML = `<b>Calories:</b> ${item.nutrition && item.nutrition.nutrients ? (item.nutrition.nutrients.find(n => n.name === 'Calories')?.amount + ' kcal') : 'N/A'}`;
            }
            [used, missed].forEach(el => {
                el.style.wordBreak = 'break-word';
                el.style.overflow = 'hidden';
                el.style.textOverflow = 'ellipsis';
                el.style.maxWidth = '95%';
                el.style.color = '#ff9800';
            });

            const infoContainer = document.createElement('div');
            infoContainer.style.display = 'flex';
            infoContainer.style.flexDirection = 'column';
            infoContainer.style.flexGrow = '1';
            infoContainer.appendChild(title);
            infoContainer.appendChild(used);
            infoContainer.appendChild(missed);

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

        let pagination = document.getElementById('pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.id = 'pagination';
            resultsDiv.parentNode.insertBefore(pagination, resultsDiv.nextSibling);
        }
        pagination.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-arrow';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = page === 1;
        prevBtn.onclick = () => {
            allLoaded = false;
            fetchRecipes(page - 1);
        };
        pagination.appendChild(prevBtn);

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${page}`;
        pagination.appendChild(pageInfo);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-arrow';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = recipes.length < RECIPES_PER_PAGE || allLoaded;
        nextBtn.onclick = () => {
            fetchRecipes(page + 1, false);
        };
        pagination.appendChild(nextBtn);

        if (recipes.length < RECIPES_PER_PAGE) {
            allLoaded = true;
        } else {
            allLoaded = false;
        }

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
        const ingredientsList = data.extendedIngredients.map(i => `<li>${i.original}</li>`).join('');
        let instructions = data.instructions || '';
        if (!instructions && data.analyzedInstructions && data.analyzedInstructions.length > 0) {
            instructions = data.analyzedInstructions[0].steps.map(
                s => `<div style="margin-bottom: 18px; text-align:left;">${s.step}</div>`
            ).join('');
        } else if (instructions) {
            const steps = instructions.split(/\r?\n|\.(?=\s[A-Z])/).map(s => s.trim()).filter(Boolean);
            instructions = steps.map(
                s => `<div style="margin-bottom: 18px; text-align:left;">${s}</div>`
            ).join('');
        } else {
            instructions = 'No instructions provided.';
        }

        const missingIngredients = data.extendedIngredients
            .filter(i => !ingredientList.includes(i.name.toLowerCase()));

        let addMissingBtnHtml = '';
        if (missingIngredients.length > 0) {
            addMissingBtnHtml = `
                <button id="add-all-missing" class="add-to-shopping" style="margin-top:10px;">Add Missing Ingredients to Shopping List</button>
            `;
        } else {
            addMissingBtnHtml = `<p><b>All ingredients are in your pantry!</b></p>`;
        }

        let goToRecipeBtnHtml = '';
        if (data.sourceUrl) {
            goToRecipeBtnHtml = `
                <a href="${data.sourceUrl}" target="_blank" rel="noopener noreferrer">
                    <button class="add-to-shopping" style="margin-top:14px; background:linear-gradient(90deg,#a5d6a7 0%,#388e3c 100%); color:#23472b;">Go to Recipe Website</button>
                </a>
            `;
        }

        let saveBtnHtml = `
            <button id="save-recipe-btn" class="add-to-shopping" style="margin-top:10px;" ${isRecipeSaved(data.id) ? 'disabled' : ''}>
                ${isRecipeSaved(data.id) ? 'Saved' : 'Save Recipe'}
            </button>
        `;
        content.innerHTML = `
            <h2>${data.title}</h2>
            <img src="${data.image}" alt="${data.title}">
            ${saveBtnHtml}
            <p><b>Ingredients:</b></p>
            <ul style="list-style:none; padding-left:0;">${ingredientsList}</ul>
            ${addMissingBtnHtml}
            ${goToRecipeBtnHtml}
            <p><b>Instructions:</b></p>
            <div>${instructions}</div>
        `;
        details.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const addAllBtn = document.getElementById('add-all-missing');
        if (addAllBtn) {
            addAllBtn.addEventListener('click', function() {
                missingIngredients.forEach(i => addToShoppingList(i.name));
                addAllBtn.disabled = true;
                addAllBtn.textContent = 'All Added!';
            });
        }

        const saveBtn = document.getElementById('save-recipe-btn');
        if (saveBtn && !isRecipeSaved(data.id)) {
            saveBtn.addEventListener('click', function() {
                saveRecipe({ id: data.id, title: data.title, image: data.image });
                saveBtn.textContent = 'Saved';
                saveBtn.disabled = true;
            });
        }

    } catch (err) {
        content.innerHTML = 'Could not load recipe details.';
        console.error(err);
    }
}

function closeRecipeDetails() {
    document.getElementById('recipe-details').style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('mousedown', function (e) {
    const details = document.getElementById('recipe-details');
    const modal = document.getElementById('recipe-modal');
    if (details && details.style.display === 'flex') {
        if (modal && !modal.contains(e.target)) {
            closeRecipeDetails();
        }
    }
});

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

async function showRandomRecipes() {
    const section = document.getElementById('random-recipes-section');
    const container = document.getElementById('random-recipes');
    section.style.display = 'block';
    container.innerHTML = '';
    try {
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

            const diets = document.createElement('p');
            diets.innerHTML = `<b>Diets:</b> ${(item.diets && item.diets.length) ? item.diets.join(', ') : 'None'}`;
            const calories = document.createElement('p');
            calories.innerHTML = `<b>Calories:</b> ${
                item.nutrition && item.nutrition.nutrients
                ? (item.nutrition.nutrients.find(n => n.name === 'Calories')?.amount + ' kcal')
                : 'N/A'
            }`;

            const infoContainer = document.createElement('div');
            infoContainer.style.display = 'flex';
            infoContainer.style.flexDirection = 'column';
            infoContainer.style.flexGrow = '1';
            infoContainer.appendChild(title);
            infoContainer.appendChild(diets);
            infoContainer.appendChild(calories);

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

function showSavedRecipes() {
    const resultsDiv = document.getElementById('results');
    const paginationDiv = document.getElementById('pagination');
    document.getElementById('random-recipes-section').style.display = 'none';
    resultsDiv.innerHTML = '';
    if (paginationDiv) paginationDiv.innerHTML = '';
    if (!savedRecipes.length) {
        resultsDiv.textContent = 'No saved recipes.';
        return;
    }
    savedRecipes.forEach(item => {
        const card = document.createElement('div');
        card.className = 'recipe-item';
        card.style.height = '420px';
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        const title = document.createElement('h3');
        title.textContent = item.title;
        title.style.wordBreak = 'break-word';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
        title.style.maxWidth = '95%';

        const infoContainer = document.createElement('div');
        infoContainer.style.display = 'flex';
        infoContainer.style.flexDirection = 'column';
        infoContainer.style.flexGrow = '1';
        infoContainer.appendChild(title);

        const btn = document.createElement('button');
        btn.className = 'view-details-btn';
        btn.textContent = 'View Details';
        btn.onclick = async (e) => {
            e.preventDefault();
            await displayRecipe(item.id);
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'add-to-shopping';
        removeBtn.style.marginTop = '8px';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = (e) => {
            e.preventDefault();
            removeSavedRecipe(item.id);
            showSavedRecipes();
        };

        card.appendChild(img);
        card.appendChild(infoContainer);
        card.appendChild(btn);
        card.appendChild(removeBtn);
        resultsDiv.appendChild(card);
    });
}

window.searchRecipes = () => fetchRecipes(1);
window.closeRecipeDetails = closeRecipeDetails;

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('ingredient-input');
    const datalist = document.getElementById('ingredient-suggestions');
    renderIngredientChips();
    if (!ingredientList.length) {
        showRandomRecipes();
    }
    input.addEventListener('input', async function() {
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

    input.addEventListener('change', function() {
        const value = input.value.trim();
        if (value && !ingredientList.includes(value.toLowerCase())) {
            ingredientList.push(value.toLowerCase());
            renderIngredientChips();
            fetchRecipes(1);
        }
        input.value = '';
        datalist.innerHTML = '';
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
            e.preventDefault();
            const value = input.value.trim();
            if (value && !ingredientList.includes(value.toLowerCase())) {
                ingredientList.push(value.toLowerCase());
                renderIngredientChips();
                fetchRecipes(1);
            }
            input.value = '';
            datalist.innerHTML = '';
        } else if (e.key === 'Backspace' && input.value === '') {
            ingredientList.pop();
            renderIngredientChips();
        }
    });

    input.addEventListener('blur', function() {
        const value = input.value.trim();
        if (value && !ingredientList.includes(value.toLowerCase())) {
            ingredientList.push(value.toLowerCase());
            renderIngredientChips();
            fetchRecipes(1);
        }
        input.value = '';
        datalist.innerHTML = '';
    });

    document.getElementById('show-shopping-list').addEventListener('click', showShoppingListModal);
    document.getElementById('close-shopping-list').addEventListener('click', closeShoppingListModal);

    document.getElementById('search-button').classList.add('circle-btn');
    document.getElementById('show-shopping-list').classList.add('circle-btn');

    const reloadBtn = document.getElementById('reload-random-recipes');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            showRandomRecipes();
        });
    }

    const savedBtn = document.getElementById('show-saved-recipes');
    if (savedBtn) {
        savedBtn.addEventListener('click', showSavedRecipes);
    }
});

function addToShoppingList(ingredient) {
    if (!shoppingList.includes(ingredient)) {
        shoppingList.push(ingredient);
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
        renderShoppingList();
    }
}

function renderShoppingList() {
    const content = document.getElementById('shopping-list-content');
    if (!content) return;
    if (shoppingList.length === 0) {
        content.innerHTML = '<p>Your shopping list is empty.</p>';
    } else {
        content.innerHTML = `
            <ul>
                ${shoppingList.map((item, idx) =>
                    `<li>
                        <span>${item}</span>
                        <button class="remove-chip" onclick="removeFromShoppingList(${idx})">&times;</button>
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

document.addEventListener('mousedown', function (e) {
    const modal = document.getElementById('shopping-list-modal');
    if (modal && modal.style.display === 'flex') {
        const content = modal.querySelector('div[style*="background:#fff"]');
        if (content && !content.contains(e.target)) {
            closeShoppingListModal();
        }
    }
});

function closeShoppingListModal() {
    document.getElementById('shopping-list-modal').style.display = 'none';
}

function removeFromShoppingList(idx) {
    shoppingList.splice(idx, 1);
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    renderShoppingList();
}

function isRecipeSaved(recipeId) {
    return savedRecipes.some(r => r.id === recipeId);
}

function saveRecipe(recipe) {
    if (!isRecipeSaved(recipe.id)) {
        savedRecipes.push({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image
        });
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    }
}

function removeSavedRecipe(recipeId) {
    savedRecipes = savedRecipes.filter(r => r.id !== recipeId);
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
}