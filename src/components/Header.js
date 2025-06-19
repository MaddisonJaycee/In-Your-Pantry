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
          marginRight: '16px'
        }}
        onClick={handleShowShoppingList}
      >
        Shopping List
      </Button>
      <Button
        variant="contained"
        style={{
          ...circleButtonStyle
        }}
        onClick={handleSearch}
      >
        Search
      </Button>
    </div>
  );
};

export default Header;