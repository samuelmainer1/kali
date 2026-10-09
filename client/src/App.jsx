import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StoreLayout from './components/StoreLayout';
import { useAuth } from './context/AuthContext';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Track = lazy(() => import('./pages/Track'));
const Fulfillment = lazy(() => import('./pages/Fulfillment'));
const Vendors = lazy(() => import('./pages/Vendors'));
const VendorDirectory = lazy(() => import('./pages/VendorDirectory'));
const VendorShop = lazy(() => import('./pages/VendorShop'));
const Account = lazy(() => import('./pages/Account'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Contact = lazy(() => import('./pages/Contact'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Returns = lazy(() => import('./pages/Returns'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Careers = lazy(() => import('./pages/Careers'));
const Compare = lazy(() => import('./pages/Compare'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const BlackFriday = lazy(() => import('./pages/BlackFriday'));
const Deals = lazy(() => import('./pages/Deals'));
const Brands = lazy(() => import('./pages/Brands'));

const routeFallback = (
  <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-ink-mute">
    Loading page…
  </div>
);

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-20 text-center text-ink-mute">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function DashboardRouter() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-20 text-center text-ink-mute">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'vendor') return <VendorDashboard />;
  return <Navigate to="/account" replace />;
}

export default function App() {
  return (
    <Suspense fallback={routeFallback}>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          {/* Indexable category landing pages — the sitemap, breadcrumb JSON-LD and the
              server's injectCategoryHtml() all target /category/:slug, so the SPA must
              render the shop filtered by the PATH param here (the query form
              /shop?category= now 301s here server-side). Shop also still accepts
              ?category= for the dev server and any client-side legacy links. */}
          <Route path="category/:slug" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-success" element={<OrderSuccess />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="track" element={<Track />} />
          <Route path="fulfillment" element={<Fulfillment />} />
          <Route path="shipping" element={<Navigate to="/fulfillment" replace />} />
          <Route path="sell" element={<Vendors />} />
          <Route path="sell-on-bigdrop" element={<Navigate to="/sell" replace />} />
          <Route path="vendors/:slug" element={<VendorShop />} />
          <Route path="vendors" element={<VendorDirectory />} />
          <Route path="about" element={<About />} />
          <Route path="about-us" element={<Navigate to="/about" replace />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="contact" element={<Contact />} />
          <Route path="contact-us" element={<Navigate to="/contact" replace />} />
          <Route path="faq" element={<HelpCenter />} />
          <Route path="help" element={<HelpCenter />} />
          <Route path="help-center" element={<Navigate to="/help" replace />} />
          <Route path="returns" element={<Returns />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="careers" element={<Careers />} />
          <Route path="black-friday" element={<BlackFriday />} />
          <Route path="deals" element={<Deals />} />
          <Route path="offers" element={<Navigate to="/deals" replace />} />
          <Route path="brands" element={<Brands />} />
          <Route path="compare" element={<Compare />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route
            path="account"
            element={
              <Protected>
                <Account />
              </Protected>
            }
          />
          <Route
            path="dashboard"
            element={
              <Protected roles={['vendor', 'admin']}>
                <DashboardRouter />
              </Protected>
            }
          />
          <Route
            path="admin"
            element={
              <Protected roles={['admin']}>
                <AdminDashboard />
              </Protected>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
