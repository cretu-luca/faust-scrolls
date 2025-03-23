import { useEffect, useRef, useState } from 'react';

interface ArxivEntry {
  title: string;
  authors: string;
  journal: string;
  citations: number;
  year: string;
  abstract?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

interface DomainHypergraphProps {
  entries: ArxivEntry[];
  useEmbeddings: boolean;
  similarityThreshold: number;
}

interface PopupPosition {
  x: number;
  y: number;
}

export default function DomainHypergraph({ entries: propsEntries, useEmbeddings, similarityThreshold }: DomainHypergraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredArticle, setHoveredArticle] = useState<ArxivEntry | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArxivEntry | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [bounds, setBounds] = useState({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [entries, setEntries] = useState<ArxivEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<ArxivEntry | null>(null);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await fetch('/data/articles-with-embeddings.json');
        if (!response.ok) throw new Error('Failed to load articles');
        const data = await response.json() as ArxivEntry[];
        
        const titleToEntry = new Map<string, ArxivEntry>();
        
        data.forEach(entry => {
          if (entry.coordinates && 
              !isNaN(entry.coordinates.x) && 
              !isNaN(entry.coordinates.y)) {
            titleToEntry.set(entry.title, entry);
          }
        });
        
        const existingCoords = Array.from(titleToEntry.values())
          .map(entry => entry.coordinates!)
          .filter(coords => coords && !isNaN(coords.x) && !isNaN(coords.y));
        
        const avgX = existingCoords.length > 0 
          ? existingCoords.reduce((sum, coord) => sum + coord.x, 0) / existingCoords.length 
          : 0;
        const avgY = existingCoords.length > 0 
          ? existingCoords.reduce((sum, coord) => sum + coord.y, 0) / existingCoords.length 
          : 0;
        
        if (propsEntries) {
          propsEntries.forEach((entry, index) => {
            const existingEntry = titleToEntry.get(entry.title);
            if (existingEntry) {
              titleToEntry.set(entry.title, {
                ...existingEntry,
                ...entry,
                coordinates: existingEntry.coordinates
              });
            } else {
              titleToEntry.set(entry.title, {
                ...entry,
                coordinates: {
                  x: avgX + 2 * Math.cos((index * 2 * Math.PI) / (propsEntries.length || 1)),
                  y: avgY + 2 * Math.sin((index * 2 * Math.PI) / (propsEntries.length || 1))
                }
              });
            }
          });
        }
        
        const allArticles = Array.from(titleToEntry.values())
          .filter(entry => 
            entry.coordinates && 
            !isNaN(entry.coordinates.x) && 
            !isNaN(entry.coordinates.y)
          );
        
        setEntries(allArticles);
        
        if (allArticles.length > 0) {
          const xCoords = allArticles.map(entry => entry.coordinates!.x);
          const yCoords = allArticles.map(entry => entry.coordinates!.y);
          const padding = 20;
          setBounds({
            minX: Math.min(...xCoords) - padding,
            maxX: Math.max(...xCoords) + padding,
            minY: Math.min(...yCoords) - padding,
            maxY: Math.max(...yCoords) + padding
          });
        } else {
          setBounds({ minX: -10, maxX: 10, minY: -10, maxY: 10 });
        }
      } catch (error) {
        console.error('Error loading articles:', error);
        setBounds({ minX: -10, maxX: 10, minY: -10, maxY: 10 });
      }
    };

    loadArticles();
  }, [propsEntries]);

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || selectedArticle) return; // Don't update hover state if an article is selected

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handleCanvasMouseLeave = () => {
    if (selectedArticle) return; // Don't clear state if an article is selected
    setMousePosition(null);
    setHoveredArticle(null);
    setPopupPosition(null);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const padding = 50;

    const scaleX = (canvas.width - 2 * padding) / (bounds.maxX - bounds.minX);
    const scaleY = (canvas.height - 2 * padding) / (bounds.maxY - bounds.minY);

    const dataX = (x - padding) / scaleX + bounds.minX;
    const dataY = (y - padding) / scaleY + bounds.minY;

    let closest = null;
    let minDist = Infinity;
    entries.forEach((article) => {
      if (!article.coordinates) return;
      const dx = article.coordinates.x - dataX;
      const dy = article.coordinates.y - dataY;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closest = article;
      }
    });

    if (closest && minDist < 1) {
      if (selectedArticle === closest) {
        setSelectedArticle(null);
        setPopupPosition(null);
      } else {
        setSelectedArticle(closest);
        setPopupPosition({ x: event.clientX, y: event.clientY });
      }
    } else if (!closest || minDist >= 1) {
      setSelectedArticle(null);
      setPopupPosition(null);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResult(null);
      setSelectedArticle(null);
      setPopupPosition(null);
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const allEntries = [...entries];
    if (propsEntries) {
      propsEntries.forEach(entry => {
        if (!allEntries.some(e => e.title === entry.title)) {
          allEntries.push(entry);
        }
      });
    }

    const result = allEntries.find(article => 
      article && (
        (article.title || '').toLowerCase().includes(normalizedQuery) ||
        (article.authors || '').toLowerCase().includes(normalizedQuery) ||
        (article.journal || '').toLowerCase().includes(normalizedQuery)
      )
    );

    setSearchResult(result || null);
    
    if (result) {
      setSelectedArticle(result);
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        if (result.coordinates) {
          const padding = 50;
          const scaleX = (canvas.width - 2 * padding) / (bounds.maxX - bounds.minX);
          const scaleY = (canvas.height - 2 * padding) / (bounds.maxY - bounds.minY);
          
          const x = (result.coordinates.x - bounds.minX) * scaleX + padding;
          const y = (result.coordinates.y - bounds.minY) * scaleY + padding;
          
          setPopupPosition({ 
            x: rect.left + x,
            y: rect.top + y
          });
        } else {
          setPopupPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          });
        }
      }
    } else {
      setSelectedArticle(null);
      setPopupPosition(null);
    }
  };

  const getNeighbors = (article: ArxivEntry, radius: number) => {
    if (!article.coordinates) return [];
    return entries.filter(a => {
      if (a === article || !a.coordinates) return false;
      const coords = a.coordinates; // Destructure to satisfy TypeScript
      const dx = coords.x - article.coordinates!.x;
      const dy = coords.y - article.coordinates!.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  };

  useEffect(() => {
    if (!canvasRef.current || entries.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 50;
    canvas.width = window.innerWidth - 100;
    canvas.height = window.innerHeight - 200;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = (canvas.width - 2 * padding) / (bounds.maxX - bounds.minX);
    const scaleY = (canvas.height - 2 * padding) / (bounds.maxY - bounds.minY);

    const validCitations = entries.map(e => e.citations || 0).filter(c => !isNaN(c));
    const maxCitations = validCitations.length > 0 ? Math.max(...validCitations) : 1;

    const searchNeighbors = searchResult ? getNeighbors(searchResult, 3) : [];

    entries.forEach((article) => {
      if (!article.coordinates) return;

      const x = (article.coordinates.x - bounds.minX) * scaleX + padding;
      const y = (article.coordinates.y - bounds.minY) * scaleY + padding;

      let isHighlighted = false;
      if (!selectedArticle && mousePosition) {
        const dx = x - mousePosition.x;
        const dy = y - mousePosition.y;
        isHighlighted = Math.sqrt(dx * dx + dy * dy) <= 8;
      }
      if (selectedArticle === article) {
        isHighlighted = true;
      }

      let color;
      if (searchResult) {
        if (article === searchResult) {
          color = 'rgba(255, 99, 0, 0.9)';
        } else if (searchNeighbors.includes(article)) {
          color = 'rgba(66, 135, 245, 0.8)';
        } else {
          color = getCitationColor(article.citations || 0, maxCitations, true);
        }
      } else {
        color = getCitationColor(article.citations || 0, maxCitations, false);
      }

      const bubbleSize = getBubbleSize(article.citations || 0, maxCitations, isHighlighted);
      ctx.beginPath();
      ctx.arc(x, y, bubbleSize, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (isHighlighted) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (!selectedArticle) {
          setHoveredArticle(article);
          setPopupPosition({ x: mousePosition?.x || x, y: mousePosition?.y || y });
        }
      }
    });

  }, [entries, bounds, mousePosition, selectedArticle, searchResult]);

  const getCitationColor = (citations: number, maxCitations: number, dimmed: boolean = false) => {
    const intensity = Math.pow(citations / maxCitations, 0.3);
    const r = Math.round(255 * (1 - intensity * 0.7));
    const g = Math.round(255 * intensity);
    const b = 50;
    const alpha = dimmed ? (0.3 + intensity * 0.3) : (0.5 + intensity * 0.5);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getBubbleSize = (citations: number, maxCitations: number, isHighlighted: boolean) => {
    const minSize = 3;
    const maxSize = 18;
    const power = 0.4;
    const normalizedCitations = Math.pow(citations / maxCitations, power);
    const size = minSize + (maxSize - minSize) * normalizedCitations;
    return isHighlighted ? size + 3 : size;
  };

  const displayedArticle = selectedArticle || hoveredArticle;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg relative">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title, author, or journal..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg shadow-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
        />
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        className="border rounded cursor-pointer"
      />
      
      {displayedArticle && popupPosition && (
        <div 
          className="absolute bg-white rounded-lg shadow-xl border p-4 z-10 max-w-md"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translate(-50%, 20px)'
          }}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg mb-2 pr-8 text-gray-800">{displayedArticle.title}</h3>
            <button 
              onClick={() => {
                setSelectedArticle(null);
                setHoveredArticle(null);
                setPopupPosition(null);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium text-gray-800">Author:</span>{" "}
              {displayedArticle.authors}
            </p>
            <p>
              <span className="font-medium text-gray-800">Year:</span>{" "}
              {displayedArticle.year}
            </p>
            <p>
              <span className="font-medium text-gray-800">Citations:</span>{" "}
              {displayedArticle.citations.toLocaleString()}
            </p>
            <p>
              <span className="font-medium text-gray-800">Journal:</span>{" "}
              {displayedArticle.journal}
            </p>
            {displayedArticle.abstract && (
              <p>
                <span className="font-medium text-gray-800">Abstract:</span>{" "}
                <span className="block mt-1">{displayedArticle.abstract}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 