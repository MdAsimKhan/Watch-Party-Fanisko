import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => (
  <div
    style={{
      margin: '1em',
      paddingBottom: '1em',
      fontSize: '18px',
      color: 'white',
    }}
  >
    <Link style={{ color: 'white' }} to="/terms">
      Team
    </Link>
    {' · '}
    <Link style={{ color: 'white' }} to="/privacy">
      Fanisko
    </Link>
    {' · '}
    <Link style={{ color: 'white' }} to="/faq">
      Asim
    </Link>
    {' · '}
    <Link style={{ color: 'white' }} to="/discordBot">
      Mrigesh
    </Link>
  </div>
);
