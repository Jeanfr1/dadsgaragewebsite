import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/figtree';
import './styles/main.css';

import { start } from './js/engine.js';
import { initScenes } from './js/scenes.js';
import { initUI } from './js/ui.js';

initScenes();
start();
initUI();
