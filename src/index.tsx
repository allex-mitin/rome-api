import {createRoot} from 'react-dom/client';
import '@asyncapi/react-component/styles/default.min.css';
import 'swagger-ui-react/swagger-ui.css';
// App shell first, then the per-renderer overrides: they are plain CSS with equal specificity,
// so the order decides which one wins.
import './assets/css/main.css';
import './assets/css/openapi.css';
import './assets/css/asyncapi.css';

import {App} from './components/App';

createRoot(document.getElementById('root')!).render(<App />);
