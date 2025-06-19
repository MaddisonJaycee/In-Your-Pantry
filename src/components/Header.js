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
        color="primary"
        onClick={handleShowShoppingList}
        style={{ ...circleButtonStyle, marginRight: '16px' }}
      >
        Shopping List
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleSearch}
        style={circleButtonStyle}
      >
        Search
      </Button>
    </div>
  );
};

export default Header;