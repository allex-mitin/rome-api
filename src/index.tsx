import {createRoot} from 'react-dom/client';
import '@asyncapi/react-component/styles/default.min.css';
import 'swagger-ui-react/swagger-ui.css';
import './assets/css/main.css';

import {App} from './components/App';

createRoot(document.getElementById('root')!).render(<App />);
