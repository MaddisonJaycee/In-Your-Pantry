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
          background: 'linear-gradient(90deg, #ffe082 0%, #ff7043 100%)',
          color: '#3e2c1c'
        }}
        onClick={handleShowShoppingList}
      >
        Shopping List
      </Button>
      <Button
        variant="contained"
        style={{
          ...circleButtonStyle,
          background: 'linear-gradient(90deg, #ff9800 0%, #8bc34a 100%)',
          color: '#fffdfa'
        }}
        onClick={handleSearch}
      >
        Search
      </Button>
    </div>
  );
};

export default Header;