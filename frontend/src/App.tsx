import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from './routes/AppRoutes';

const router = createBrowserRouter(appRoutes);

export default function App() {
  return <RouterProvider router={router} />;
}
