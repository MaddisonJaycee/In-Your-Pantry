import React from 'react';

const Header = ({ handleShowShoppingList, handleSearch }) => (
  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
    <button className="circle-btn" onClick={handleShowShoppingList}>
      Shopping List
    </button>
    <button className="circle-btn" onClick={handleSearch}>
      Search
    </button>
  </div>
);

export default Header;