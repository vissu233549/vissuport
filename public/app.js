import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js";
import SignaturePad from "https://cdn.jsdelivr.net/npm/signature_pad@2.3.2/dist/signature_pad.umd.min.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const root = ReactDOM.createRoot(document.getElementById('root'));

function Login({ user }) {
  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };
  const logout = async () => {
    await signOut(auth);
  };
  return React.createElement('div', { className: 'p-4' },
    user ? React.createElement('button', { className: 'px-4 py-2 bg-red-500 text-white', onClick: logout }, 'Sign out') :
           React.createElement('button', { className: 'px-4 py-2 bg-blue-500 text-white', onClick: login }, 'Sign in with Google'));
}

function ItemRow({ item, onChange, onRemove }) {
  return React.createElement('div', { className: 'flex space-x-2 mb-2' },
    React.createElement('input', { className: 'border p-1 flex-1', placeholder: 'Item name', value: item.name, onChange: e => onChange({ ...item, name: e.target.value }) }),
    React.createElement('input', { type: 'number', className: 'border p-1 w-20', placeholder: 'Qty', value: item.qty, onChange: e => onChange({ ...item, qty: +e.target.value }) }),
    React.createElement('input', { type: 'number', className: 'border p-1 w-24', placeholder: 'Price', value: item.price, onChange: e => onChange({ ...item, price: +e.target.value }) }),
    React.createElement('span', { className: 'p-1 w-24 text-right' }, (item.qty * item.price).toFixed(2)),
    React.createElement('button', { className: 'px-2 bg-gray-300', onClick: onRemove }, 'X')
  );
}

function SignaturePadComponent({ onEnd }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const pad = new SignaturePad(canvasRef.current);
    pad.onEnd = () => onEnd(pad.toDataURL());
  }, []);
  return React.createElement('canvas', { ref: canvasRef, className: 'border w-full h-40 bg-white' });
}

function InvoiceForm({ user }) {
  const [company, setCompany] = React.useState({ name: '', reg: '', phone: '', address: '' });
  const [items, setItems] = React.useState([]);
  const [logo, setLogo] = React.useState(null);
  const [signature, setSignature] = React.useState(null);
  const [tax, setTax] = React.useState(0);

  const addItem = () => setItems([...items, { name: '', qty: 1, price: 0 }]);
  const updateItem = (idx, itm) => { const newItems = [...items]; newItems[idx] = itm; setItems(newItems); };
  const removeItem = idx => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const taxAmount = subtotal * tax / 100;
  const total = subtotal + taxAmount;

  const saveInvoice = async () => {
    let logoUrl = null;
    let sigUrl = null;
    if (logo) {
      const logoRef = ref(storage, `${user.uid}/logo.png`);
      await uploadBytes(logoRef, logo);
      logoUrl = await getDownloadURL(logoRef);
    }
    if (signature) {
      const sigRef = ref(storage, `${user.uid}/signature.png`);
      const blob = await (await fetch(signature)).blob();
      await uploadBytes(sigRef, blob);
      sigUrl = await getDownloadURL(sigRef);
    }
    await addDoc(collection(db, 'invoices'), { uid: user.uid, company, items, tax, logoUrl, sigUrl, created: Date.now(), subtotal, total });
    alert('Invoice saved');
    setItems([]);
  };

  return React.createElement('div', { className: 'p-4 space-y-4' },
    React.createElement('div', { className: 'space-y-2' },
      React.createElement('input', { className: 'border p-1 w-full', placeholder: 'Company Name', value: company.name, onChange: e => setCompany({ ...company, name: e.target.value }) }),
      React.createElement('input', { className: 'border p-1 w-full', placeholder: 'Registration Number', value: company.reg, onChange: e => setCompany({ ...company, reg: e.target.value }) }),
      React.createElement('input', { className: 'border p-1 w-full', placeholder: 'Phone Number', value: company.phone, onChange: e => setCompany({ ...company, phone: e.target.value }) }),
      React.createElement('input', { className: 'border p-1 w-full', placeholder: 'Address', value: company.address, onChange: e => setCompany({ ...company, address: e.target.value }) }),
      React.createElement('input', { type: 'file', accept: 'image/*', onChange: e => setLogo(e.target.files[0]) })
    ),
    React.createElement('div', {},
      items.map((it, idx) => React.createElement(ItemRow, { key: idx, item: it, onChange: itm => updateItem(idx, itm), onRemove: () => removeItem(idx) })),
      React.createElement('button', { className: 'px-2 py-1 bg-green-500 text-white', onClick: addItem }, 'Add Item')
    ),
    React.createElement('div', { className: 'space-y-2' },
      React.createElement('label', {}, 'Tax % '),
      React.createElement('input', { type: 'number', className: 'border p-1', value: tax, onChange: e => setTax(+e.target.value) })
    ),
    React.createElement('div', {}, `Subtotal: $${subtotal.toFixed(2)} Tax: $${taxAmount.toFixed(2)} Total: $${total.toFixed(2)}`),
    React.createElement('div', {},
      React.createElement('p', {}, 'Signature'),
      React.createElement(SignaturePadComponent, { onEnd: setSignature })
    ),
    React.createElement('button', { className: 'px-4 py-2 bg-blue-600 text-white', onClick: saveInvoice }, 'Save Invoice')
  );
}

function Dashboard({ user }) {
  const [invoices, setInvoices] = React.useState([]);
  React.useEffect(() => {
    const fetchInvoices = async () => {
      const q = query(collection(db, 'invoices'), where('uid', '==', user.uid));
      const snap = await getDocs(q);
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchInvoices();
  }, [user]);
  return React.createElement('div', { className: 'p-4' },
    React.createElement('h2', { className: 'text-xl mb-2' }, 'Past Invoices'),
    invoices.map(inv => React.createElement('div', { key: inv.id, className: 'border p-2 mb-2' },
      React.createElement('div', {}, inv.company.name),
      React.createElement('div', {}, `Total: $${inv.total.toFixed(2)}`)
    ))
  );
}

function App() {
  const [user, setUser] = React.useState(null);
  const [showDashboard, setShowDashboard] = React.useState(false);
  React.useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);
  if (!user) return React.createElement(Login, { user });
  return React.createElement('div', {},
    React.createElement(Login, { user }),
    React.createElement('div', { className: 'flex space-x-4 p-4' },
      React.createElement('button', { className: 'px-2 py-1 bg-gray-300', onClick: () => setShowDashboard(false) }, 'Create Invoice'),
      React.createElement('button', { className: 'px-2 py-1 bg-gray-300', onClick: () => setShowDashboard(true) }, 'Dashboard')
    ),
    showDashboard ? React.createElement(Dashboard, { user }) : React.createElement(InvoiceForm, { user })
  );
}

root.render(React.createElement(App));
