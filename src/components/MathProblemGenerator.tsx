import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { UploadCloud, Copy, FileDown, Loader2, ImagePlus } from 'lucide-react';

const MathProblemGenerator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [count, setCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<string>('Tương đương mức độ');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Handle Ctrl+V paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setImage(result);
      // Wait a moment for UI to update then extract
      extractText(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const extractText = async (base64Image: string, mimeType: string) => {
    setIsExtracting(true);
    setErrorMessage(null);
    setExtractedText('');
    setGeneratedText('');
    try {
      // remove prefix
      const base64Data = base64Image.split(',')[1];
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType })
      });
      const data = await res.json();
      if (res.ok) {
        setExtractedText(data.text);
      } else {
        setErrorMessage("Lỗi trích xuất: " + data.error);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Đã xảy ra lỗi khi kết nối server.");
    } finally {
      setIsExtracting(false);
    }
  };

  const generateSimilar = async () => {
    if (!extractedText) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/generate-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText: extractedText, count, difficulty })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedText(data.text);
      } else {
        setErrorMessage("Lỗi tạo bài tập: " + data.error);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Đã xảy ra lỗi khi tạo bài tập.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [copyOriginalFeedback, setCopyOriginalFeedback] = useState(false);
  const [copyGeneratedFeedback, setCopyGeneratedFeedback] = useState(false);

  const copyToClipboard = (text: string, type: 'original' | 'generated') => {
    navigator.clipboard.writeText(text);
    if (type === 'original') {
      setCopyOriginalFeedback(true);
      setTimeout(() => setCopyOriginalFeedback(false), 2000);
    } else {
      setCopyGeneratedFeedback(true);
      setTimeout(() => setCopyGeneratedFeedback(false), 2000);
    }
  };

  const exportToWord = () => {
    if (!resultRef.current) return;
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>";
    const postHtml = "</body></html>";
    const html = preHtml + resultRef.current.innerHTML + postHtml;

    const blob = new Blob(['\\ufeff', html], {
        type: 'application/msword'
    });
    
    // Specify link url
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    const filename = 'bai_tap_tuong_tu.doc';
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    
    // Create a link to the file
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <header className="mb-8 relative">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UploadCloud className="w-8 h-8 text-blue-600" />
          MathGenius: Tạo Bài Tập Tương Tự
        </h1>
        <p className="text-gray-600 mt-2">Dán ảnh (Ctrl+V) hoặc tải ảnh lên để trích xuất văn bản công thức và tự động sinh câu hỏi tương tự.</p>
        
        {errorMessage && (
          <div className="absolute top-0 right-0 max-w-sm bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative shadow-sm" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
            <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMessage(null)}>
              <span className="text-lg">×</span>
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input and Extract */}
        <div className="space-y-6">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors bg-white min-h-[250px] relative cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Uploaded" className="max-h-64 object-contain rounded" />
            ) : (
              <>
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <ImagePlus className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-medium text-gray-700">Tải ảnh lên hoặc nhấn Ctrl+V để dán</p>
                <p className="text-sm text-gray-500 mt-1">Định dạng JPG, PNG hiển thị rõ nét công thức</p>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              className="hidden" 
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Văn bản trích xuất (Gốc)</h2>
              <button 
                onClick={() => copyToClipboard(extractedText, 'original')}
                disabled={!extractedText}
                className="text-gray-500 hover:text-gray-800 disabled:opacity-50 flex items-center gap-1 text-sm font-medium transition-colors"
                title="Sao chép bản gốc"
              >
                {copyOriginalFeedback ? <span className="text-green-600 flex items-center gap-1"><Copy className="w-4 h-4" /> Đã chép</span> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
            <div className="p-4 min-h-[150px] relative">
              {isExtracting && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-2 font-medium text-blue-600">Đang nhận diện chữ và công thức...</span>
                </div>
              )}
              {extractedText ? (
                <div className="prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {extractedText}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-400 italic text-center mt-8">Nội dung sẽ hiển thị ở đây sau khi trích xuất...</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings and Output */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Cấu hình tạo câu hỏi</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng bài</label>
                <input 
                  type="number" 
                  min={1} 
                  max={20} 
                  value={count} 
                  onChange={e => setCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
                <select 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Dễ hơn một chút">Dễ hơn (Cơ bản)</option>
                  <option value="Tương đương mức độ">Tương đương</option>
                  <option value="Khó hơn một chút">Khó hơn (Vận dụng)</option>
                  <option value="Rất khó">Khó hơn nhiều (Vận dụng cao)</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={generateSimilar} 
              disabled={!extractedText || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isGenerating ? "Đang tạo bài tập..." : "Phát sinh bài tập tương tự"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
              <h2 className="font-semibold text-gray-800">Kết quả (Trực quan)</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => copyToClipboard(generatedText, 'generated')}
                  disabled={!generatedText}
                  className="text-gray-500 hover:text-blue-600 disabled:opacity-50 flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  {copyGeneratedFeedback ? <span className="text-green-600 flex items-center gap-1"><Copy className="w-4 h-4" /> Đã chép</span> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
                <button 
                  onClick={exportToWord}
                  disabled={!generatedText}
                  className="text-gray-500 hover:text-blue-600 disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                >
                  <FileDown className="w-4 h-4" /> Xuất Word
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto grow" ref={resultRef}>
              {generatedText ? (
                <div className="prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {generatedText}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-serif">∑</span>
                  </div>
                  <p>Kết quả bài tập với công thức toán sẽ được hiển thị và xem trước tại đây.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathProblemGenerator;
