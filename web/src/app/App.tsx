import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Home } from '../pages/Home';
export function App() {
  return <BrowserRouter><a className="skip-link" href="#main-content">Skip to content</a><Header /><main id="main-content" tabIndex={-1}><Routes><Route path="*" element={<Home />} /></Routes></main></BrowserRouter>;
}
