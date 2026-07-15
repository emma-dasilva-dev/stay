import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout/Layout";

import About from "./pages/About/About";
import Destinations from "./pages/Destinations/Destinations";
import Booking from "./pages/Booking/Booking";
import FAQ from "./pages/FAQ/FAQ";
import Account from "./pages/Account/Account";
import Admin from "./pages/Admin/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website pages */}
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

        {/* Hidden administrator area */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
