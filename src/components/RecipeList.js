import React from 'react';

const RecipeList = ({ recipes }) => {
  return (
    <div className="recipe-list">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="recipe-item">
          <div className="recipe-item-content">
            {recipe.image && (
              <img
                src={recipe.image}
                alt={recipe.title}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '12px'
                }}
              />
            )}
            <h3>{recipe.title}</h3>
            {recipe.diets && recipe.diets.length > 0 && (
              <div style={{ fontSize: '0.95rem', marginBottom: 4 }}>
                Diets: {recipe.diets.join(', ')}
              </div>
            )}
            {recipe.nutrition && recipe.nutrition.nutrients && (
              <div style={{ fontSize: '0.95rem', marginBottom: 4 }}>
                Calories: {recipe.nutrition.nutrients.find(n => n.name === 'Calories')?.amount} kcal
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecipeList;