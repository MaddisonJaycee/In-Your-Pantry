import React from 'react';

function RecipeDetails({ ingredients, userPantry, onAddMissing, image, diets, nutrition }) {
  const missingIngredients = ingredients.filter(
    (ingredient) => !userPantry.includes(ingredient)
  );

  return (
    <div>
      {image && (
        <img
          src={image}
          alt="Recipe"
          className="recipe-detail-image"
        />
      )}
      {diets && diets.length > 0 && (
        <div className="recipe-detail-diets">
          Diets: {diets.join(', ')}
        </div>
      )}
      {nutrition && nutrition.nutrients && (
        <div className="recipe-detail-calories">
          Calories: {nutrition.nutrients.find(n => n.name === 'Calories')?.amount} kcal
        </div>
      )}
      <h3>Ingredients</h3>
      <ul>
        {ingredients.map((ingredient, idx) => (
          <li key={idx}>{ingredient}</li>
        ))}
      </ul>
      <button
        className="add-to-shopping"
        style={{ marginTop: 24, width: '100%' }}
        onClick={() => onAddMissing(missingIngredients)}
        disabled={missingIngredients.length === 0}
      >
        Add Missing Ingredients to Shopping List
      </button>
    </div>
  );
}

export default RecipeDetails;