import React from 'react';

// Assume props: ingredients (array), userPantry (array), onAddMissing (function)
function RecipeDetails({ ingredients, userPantry, onAddMissing, image, diets, nutrition, ...props }) {
  // Find missing ingredients
  const missingIngredients = ingredients.filter(
    (ingredient) => !userPantry.includes(ingredient)
  );

  return (
    <div>
      {/* ...existing code... */}
      {image && (
        <img
          src={image}
          alt="Recipe"
          style={{
            width: '100%',
            height: '220px',
            objectFit: 'cover',
            borderRadius: '12px',
            marginBottom: '16px'
          }}
        />
      )}
      {/* Show diets and calories */}
      {diets && diets.length > 0 && (
        <div style={{ fontSize: '1rem', marginBottom: 8 }}>
          Diets: {diets.join(', ')}
        </div>
      )}
      {nutrition && nutrition.nutrients && (
        <div style={{ fontSize: '1rem', marginBottom: 8 }}>
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
        style={{
          marginTop: '24px',
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
        onClick={() => onAddMissing(missingIngredients)}
        disabled={missingIngredients.length === 0}
      >
        Add Missing Ingredients to Shopping List
      </button>
    </div>
  );
}

export default RecipeDetails;