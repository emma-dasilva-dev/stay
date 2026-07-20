import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./components/Layout/Layout";

import About from "./pages/About/About";
import Account from "./pages/Account/Account";
import Admin from "./pages/Admin/Admin";
import Booking from "./pages/Booking/Booking";
import Destinations from "./pages/Destinations/Destinations";
import EmployeeDashboard from "./pages/EmployeeDashboard/EmployeeDashboard";
import EmployeePortal from "./pages/EmployeePortal/EmployeePortal";
import FAQ from "./pages/FAQ/FAQ";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website */}
        <Route
          path="/"
          element={
            <Layout>
              <About />
            </Layout>
          }
        />

        <Route
          path="/destinations"
          element={
            <Layout>
              <Destinations />
            </Layout>
          }
        />

        <Route
          path="/booking"
          element={
            <Layout>
              <Booking />
            </Layout>
          }
        />

        <Route
          path="/faq"
          element={
            <Layout>
              <FAQ />
            </Layout>
          }
        />

        <Route
          path="/account"
          element={
            <Layout>
              <Account />
            </Layout>
          }
        />

        {/* Employee authentication */}
        <Route
          path="/staff"
          element={<EmployeePortal />}
        />

        {/* Employee workspace */}
        <Route
          path="/staff/dashboard"
          element={<EmployeeDashboard />}
        />

        {/* Super Admin */}
        <Route
          path="/admin"
          element={<Admin />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
