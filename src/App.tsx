/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Desktop } from './components/Desktop';
import { ParityPanel } from './components/ParityPanel';

export default function App() {
  if (new URLSearchParams(window.location.search).get('parite') === '1') {
    return <ParityPanel />;
  }
  return <Desktop />;
}
