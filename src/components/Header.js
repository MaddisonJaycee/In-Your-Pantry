import React from 'react';
import { Button } from '@material-ui/core';

const Header = ({ handleShowShoppingList, handleSearch }) => {
  const circleButtonStyle = {
    borderRadius: '50%',
    width: '90px',
    height: '90px',
    minWidth: '90px',
    minHeight: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    padding: 0,
  };

  return (
    <div>
      <Button
        variant="contained"
        style={{
          ...circleButtonStyle,
          marginRight: '16px',
          background: 'linear-gradient(90deg, #a5d6a7 0%, #388e3c 100%)',
          color: '#23472b'
        }}
        onClick={handleShowShoppingList}
      >
        Shopping List
      </Button>
      <Button
        variant="contained"
        style={{
          ...circleButtonStyle,
          background: 'linear-gradient(90deg, #388e3c 0%, #81c784 100%)',
          color: '#f6fff9'
        }}
        onClick={handleSearch}
      >
        Search
      </Button>
    </div>
  );
};

export default Header;