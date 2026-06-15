import 'katex/dist/katex.min.css';
import MathProblemGenerator from './components/MathProblemGenerator';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <MathProblemGenerator />
    </div>
  );
}
