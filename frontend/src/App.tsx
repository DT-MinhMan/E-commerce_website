import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router.js";

export const App = () => <RouterProvider router={router} />;
