import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';

// React Router uses browser encoding APIs absent in CRA's Jest environment.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
