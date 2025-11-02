import React, { useState, useEffect, createContext, useContext } from 'react';

// --- Configuration ---
// NOTE: In a real app, this would be loaded from a .env file
const API_BASE_URL = 'http://localhost:3000/api'; 
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-sweet-shop';

// --- Context for Authentication and Global State ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    // State to hold the JWT, user role, and user ID
    const [user, setUser] = useState(null); 
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial check for stored token on load
    useEffect(() => {
        const storedToken = localStorage.getItem(`${APP_ID}-token`);
        const storedUser = localStorage.getItem(`${APP_ID}-user`);
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(`${APP_ID}-token`);
        localStorage.removeItem(`${APP_ID}-user`);
    };

    const login = (userData, jwtToken) => {
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem(`${APP_ID}-token`, jwtToken);
        localStorage.setItem(`${APP_ID}-user`, JSON.stringify(userData));
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'Admin',
        login,
        logout,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// --- API Helper Functions ---
// FIX: Token and Logout function must be passed as arguments, 
// as this function is not a React component or hook.
const api = async (endpoint, options = {}, token, logout) => {
    const defaultHeaders = { 'Content-Type': 'application/json' };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    if (response.status === 401 || response.status === 403) {
        // If we get an auth error, we call the logout function passed from the component
        if (logout) {
            logout();
        }
        throw new Error("Authentication failed or access denied.");
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'An unknown error occurred');
    }

    // Check for 204 No Content
    if (response.status === 204) return null; 

    return response.json();
};

// --- Sweet Shop Data Structures ---
/**
 * @typedef {object} Sweet
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} price
 * @property {number} quantity
 */

// --- UI Components ---

/**
 * Common Button Component
 */
const Button = ({ children, onClick, disabled = false, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-md font-semibold transition duration-150 ease-in-out 
                    ${disabled 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}
                    ${className}`}
    >
        {children}
    </button>
);

/**
 * Purchase Sweet Card Component
 * @param {object} props
 * @param {Sweet} props.sweet
 * @param {Function} props.onPurchase
 */
const SweetCard = ({ sweet, onPurchase }) => {
    const inStock = sweet.quantity > 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl hover:shadow-indigo-300 transition duration-300 border-t-4 border-indigo-500">
            <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{sweet.name}</h3>
            <p className="text-sm text-indigo-600 mb-4 font-medium">{sweet.category}</p>
            <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-700 font-semibold">Price:</span>
                <span className="text-green-600 font-bold">${sweet.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-6">
                <span className="text-gray-700 font-semibold">Stock:</span>
                <span className={`font-bold ${inStock ? 'text-green-500' : 'text-red-500'}`}>
                    {sweet.quantity} {sweet.quantity === 1 ? 'item' : 'items'}
                </span>
            </div>
            
            <Button 
                onClick={() => onPurchase(sweet.id)} 
                disabled={!inStock}
                className="w-full"
            >
                {inStock ? 'Purchase' : 'Sold Out'}
            </Button>
        </div>
    );
};


/**
 * Admin Forms for CRUD Operations (Condensed into one component for single file mandate)
 * @param {object} props
 * @param {Sweet[]} props.sweets
 * @param {Function} props.fetchSweets
 * @param {Function} props.showToast
 */
const AdminPanel = ({ sweets, fetchSweets, showToast }) => {
    const { token, logout } = useAuth(); // Get auth context details here
    const [formType, setFormType] = useState('add'); // 'add', 'update', 'restock'
    const [formData, setFormData] = useState({ 
        id: '', name: '', category: '', price: 0, quantity: 0 
    });
    const [selectedSweetId, setSelectedSweetId] = useState('');
    const [restockQuantity, setRestockQuantity] = useState(1);

    const isUpdate = formType === 'update';
    const isRestock = formType === 'restock';

    // Handler for selecting a sweet for update/restock
    useEffect(() => {
        if (selectedSweetId && (isUpdate || isRestock)) {
            const sweet = sweets.find(s => s.id === selectedSweetId);
            if (sweet && isUpdate) {
                setFormData({ 
                    id: sweet.id,
                    name: sweet.name,
                    category: sweet.category,
                    price: sweet.price,
                    quantity: sweet.quantity 
                });
            }
        }
    }, [selectedSweetId, sweets, isUpdate, isRestock]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) : value 
        }));
    };

    const handleSweetSelect = (e) => {
        setSelectedSweetId(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let method, endpoint, payload;
            let successMessage = 'Operation successful!';

            if (formType === 'add') {
                method = 'POST';
                endpoint = '/sweets';
                payload = formData;
                successMessage = `${formData.name} added successfully.`;
            } else if (formType === 'update') {
                method = 'PUT';
                endpoint = `/sweets/${formData.id}`;
                payload = formData;
                successMessage = `${formData.name} updated successfully.`;
            } else if (formType === 'restock') {
                if (!selectedSweetId) throw new Error("Please select a sweet to restock.");
                method = 'POST';
                endpoint = `/sweets/${selectedSweetId}/restock`;
                payload = { amount: restockQuantity };
                successMessage = `Restocked ${restockQuantity} units of ${sweets.find(s => s.id === selectedSweetId)?.name || 'sweet'}.`;
            }

            // PASS TOKEN AND LOGOUT HERE
            await api(endpoint, { method, body: JSON.stringify(payload) }, token, logout);
            showToast(successMessage, 'success');
            fetchSweets(); // Refresh the list
            // Reset form based on type
            if (formType === 'add') setFormData({ id: '', name: '', category: '', price: 0, quantity: 0 });
            setRestockQuantity(1);

        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this sweet?")) return;
        try {
            // PASS TOKEN AND LOGOUT HERE
            await api(`/sweets/${id}`, { method: 'DELETE' }, token, logout);
            showToast('Sweet deleted successfully.', 'success');
            fetchSweets();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const SweetForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isUpdate && (
                <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Sweet to Update:</label>
                    <select 
                        value={selectedSweetId} 
                        onChange={handleSweetSelect} 
                        className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                        <option value="">Select a Sweet</option>
                        {sweets.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            )}
            
            {(formType === 'add' || (isUpdate && selectedSweetId)) && (
                <>
                    <input 
                        type="text" 
                        name="name" 
                        placeholder="Name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required 
                    />
                    <input 
                        type="text" 
                        name="category" 
                        placeholder="Category (e.g., Chocolate, Gummy)" 
                        value={formData.category} 
                        onChange={handleChange} 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required 
                    />
                    <div className="flex space-x-4">
                        <input 
                            type="number" 
                            name="price" 
                            placeholder="Price ($)" 
                            value={formData.price} 
                            onChange={handleChange} 
                            min="0.01"
                            step="0.01"
                            className="w-1/2 p-2 border border-gray-300 rounded-md"
                            required 
                        />
                        <input 
                            type="number" 
                            name="quantity" 
                            placeholder="Initial Quantity" 
                            value={formData.quantity} 
                            onChange={handleChange} 
                            min="0"
                            step="1"
                            className="w-1/2 p-2 border border-gray-300 rounded-md"
                            required 
                        />
                    </div>
                    <Button type="submit" className="w-full mt-4">{isUpdate ? 'Update Sweet' : 'Add New Sweet'}</Button>
                </>
            )}
        </form>
    );

    const RestockForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Sweet to Restock:</label>
                <select 
                    value={selectedSweetId} 
                    onChange={handleSweetSelect} 
                    className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                >
                    <option value="">Select a Sweet</option>
                    {sweets.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Current: {s.quantity})</option>
                    ))}
                </select>
            </div>
            
            {selectedSweetId && (
                <input 
                    type="number" 
                    placeholder="Restock Amount" 
                    value={restockQuantity} 
                    onChange={(e) => setRestockQuantity(parseInt(e.target.value))} 
                    min="1"
                    step="1"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required 
                />
            )}

            <Button type="submit" className="w-full mt-4" disabled={!selectedSweetId}>Perform Restock</Button>
        </form>
    );

    const DeleteList = () => (
        <div className="space-y-4">
            {sweets.length === 0 && <p className="text-center text-gray-500">No sweets available to delete.</p>}
            {sweets.map(sweet => (
                <div key={sweet.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium text-red-800 truncate pr-2">{sweet.name}</span>
                    <button 
                        onClick={() => handleDelete(sweet.id)}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition"
                    >
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );

    const titleMap = {
        add: 'Add New Sweet',
        update: 'Update Sweet Details',
        restock: 'Restock Inventory',
        delete: 'Delete Sweet'
    };
    
    const FormComponent = isRestock ? RestockForm : formType === 'delete' ? DeleteList : SweetForm;


    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-extrabold text-indigo-700 mb-6 border-b pb-3">Admin Panel</h2>
            
            <div className="flex space-x-2 mb-6">
                {['add', 'update', 'restock', 'delete'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFormType(type)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition duration-150 
                            ${formType === type 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {titleMap[type]}
                    </button>
                ))}
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{titleMap[formType]}</h3>
                <FormComponent />
            </div>
        </div>
    );
};


/**
 * Main Dashboard Component
 * @param {object} props
 * @param {Sweet[]} props.sweets
 * @param {Function} props.fetchSweets
 * @param {Function} props.showToast
 */
const Dashboard = ({ sweets, fetchSweets, showToast }) => {
    const { isAuthenticated, isAdmin, token, logout } = useAuth(); // Get auth context details here
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Filter sweets locally for immediate feedback while typing
    const filteredSweets = sweets.filter(sweet => 
        sweet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sweet.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            fetchSweets(); // Fetch all if search is cleared
            return;
        }

        setIsSearching(true);
        try {
            // No token needed for search, but pass them anyway for consistency if needed
            const result = await api(`/sweets/search?q=${encodeURIComponent(searchTerm)}`, { method: 'GET' }, token, logout); 
            fetchSweets(result); // Update the state with search results
            showToast(`Found ${result.length} result(s).`, 'info');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handlePurchase = async (sweetId) => {
        try {
            // Check if user is authenticated (required by backend middleware)
            if (!isAuthenticated) {
                showToast("Please log in to make a purchase.", 'error');
                return;
            }
            
            // PASS TOKEN AND LOGOUT HERE
            await api(`/sweets/${sweetId}/purchase`, { method: 'POST' }, token, logout);
            showToast('Sweet purchased successfully! Inventory updated.', 'success');
            fetchSweets(); // Refresh the list
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b-2 pb-2">
                Sweet Shop Inventory
            </h1>

            {/* Search and Filter Bar */}
            <form onSubmit={handleSearch} className="mb-8 flex space-x-4">
                <input
                    type="search"
                    placeholder="Search by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <Button type="submit" disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                </Button>
                <Button 
                    onClick={(e) => { e.preventDefault(); setSearchTerm(''); fetchSweets(); }}
                    className="bg-gray-500 hover:bg-gray-600"
                >
                    Clear
                </Button>
            </form>

            {/* Sweet List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSweets.map(sweet => (
                    <SweetCard 
                        key={sweet.id} 
                        sweet={sweet} 
                        onPurchase={handlePurchase}
                    />
                ))}
            </div>

            {filteredSweets.length === 0 && (
                <p className="text-center text-xl text-gray-500 mt-12">No sweets found matching your criteria. Try searching again!</p>
            )}

            {/* Admin Panel (Conditional) */}
            {isAdmin && (
                <div className="mt-16">
                    <AdminPanel 
                        sweets={sweets} 
                        fetchSweets={fetchSweets} 
                        showToast={showToast} 
                    />
                </div>
            )}
        </div>
    );
};


/**
 * Authentication Form (Login/Register)
 */
const AuthForm = ({ setPage, showToast }) => {
    const { login, logout } = useAuth(); // Get logout function
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const action = isLogin ? 'Login' : 'Registration';

        try {
            // No token needed for auth endpoints
            const result = await api(endpoint, {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { 'Content-Type': 'application/json' },
            }, null, logout);

            if (isLogin) {
                login(result.user, result.token);
                showToast(`Welcome back, ${result.user.username}!`, 'success');
            } else {
                showToast('Registration successful! Please log in.', 'success');
                setIsLogin(true); // Switch to login after successful register
            }
            
            setPage('dashboard'); // Navigate back to the dashboard

        } catch (error) {
            showToast(`${action} failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-indigo-500">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                </Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold ml-1"
                >
                    {isLogin ? 'Register Here' : 'Login Here'}
                </button>
            </p>
        </div>
    );
};


/**
 * Toast Notification System
 */
const Toast = ({ message, type, onClose }) => {
    const baseStyle = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white font-semibold flex items-center";
    const typeStyles = {
        success: 'bg-green-500',
        error: 'bg-red-600',
        info: 'bg-blue-500',
    };

    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${baseStyle} ${typeStyles[type]} z-50 transition-transform duration-300 ease-out transform translate-y-0 opacity-100`}>
            {/* Simple Icon placeholder - ideally an SVG or Lucide icon */}
            <span className="mr-3 text-xl">
                {type === 'success' ? '✔' : type === 'error' ? '✖' : 'ℹ'}
            </span>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 opacity-75 hover:opacity-100 text-lg">
                &times;
            </button>
        </div>
    );
};

// --- Main Application Component ---
const App = () => {
    const { isAuthenticated, user, logout, token } = useAuth(); // Added token here
    const [currentPage, setPage] = useState('dashboard');
    const [sweets, setSweets] = useState([]);
    const [toast, setToast] = useState(null); // { message, type }

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    const fetchSweets = async (data = null) => {
        try {
            // Pass token and logout to the API helper
            const sweetData = data || await api('/sweets', { method: 'GET' }, token, logout); 
            // Sort by quantity, showing in-stock first, then alphabetically
            sweetData.sort((a, b) => {
                if (a.quantity > 0 && b.quantity === 0) return -1;
                if (a.quantity === 0 && b.quantity > 0) return 1;
                return a.name.localeCompare(b.name);
            });
            setSweets(sweetData);
        } catch (error) {
            // Note: If /sweets is called unauthenticated, it still works, so only show
            // the error if data fetch truly fails.
            console.error('Failed to fetch sweets:', error);
            // showToast(error.message, 'error');
        }
    };

    useEffect(() => {
        // Fetch sweets once when the component mounts or auth state changes
        fetchSweets();
    }, [isAuthenticated, token]); 

    const renderContent = () => {
        switch (currentPage) {
            case 'auth':
                return <AuthForm setPage={setPage} showToast={showToast} />;
            case 'dashboard':
            default:
                return <Dashboard 
                    sweets={sweets} 
                    fetchSweets={fetchSweets} 
                    showToast={showToast} 
                />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased">
            {/* Navbar */}
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <div 
                        className="text-2xl font-black text-indigo-700 cursor-pointer"
                        onClick={() => setPage('dashboard')}
                    >
                        Sweet Shop Pro
                    </div>
                    <nav className="flex space-x-4 items-center">
                        {isAuthenticated ? (
                            <>
                                <span className="text-gray-700 font-medium hidden sm:inline">
                                    {user.username} ({user.role})
                                </span>
                                <Button onClick={logout} className="bg-red-500 hover:bg-red-600">
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setPage('auth')}>
                                Login / Register
                            </Button>
                        )}
                    </nav>
                </div>
            </header>

            <main className="pb-16 pt-8">
                {renderContent()}
            </main>

            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
        </div>
    );
};

// Wrap the main App with the AuthProvider
export default () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);
