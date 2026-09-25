import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';

jest.mock('axios');

test('redirects an anonymous visitor from saved drawings to login', async () => {
  axios.get.mockResolvedValue({ data: { user_id: null } });
  render(<MemoryRouter initialEntries={['/mydrawings']}><App /></MemoryRouter>);
  expect(await screen.findByRole('button', { name: /log in|login/i })).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/whoami'), { withCredentials: true });
});
