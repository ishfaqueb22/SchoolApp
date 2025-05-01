import { Link } from "wouter";
import { CategoryType } from "@/lib/types";

interface CategoryCardProps {
  category: CategoryType;
  compact?: boolean;
}

// Map category colors to tailwind classes
const getCategoryColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string, from: string, to: string, text: string }> = {
    primary: {
      bg: "bg-primary-600",
      from: "from-primary-500/30",
      to: "to-primary-800/70",
      text: "text-primary-100"
    },
    blue: {
      bg: "bg-blue-600",
      from: "from-blue-500/30",
      to: "to-blue-800/70",
      text: "text-blue-100"
    },
    purple: {
      bg: "bg-purple-600",
      from: "from-purple-500/30",
      to: "to-purple-800/70",
      text: "text-purple-100"
    },
    green: {
      bg: "bg-green-600",
      from: "from-green-500/30",
      to: "to-green-800/70",
      text: "text-green-100"
    }
  };

  return colorMap[color] || colorMap.primary;
};

const CategoryCard = ({ category, compact = false }: CategoryCardProps) => {
  const colorClasses = getCategoryColorClasses(category.color);

  // Render compact version for sidebar/column layouts
  if (compact) {
    return (
      <Link href={`/category?category=${encodeURIComponent(category.name)}`}>
        <div className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}>
          <div className="flex items-center p-3">
            <div className={`w-10 h-10 rounded-full ${colorClasses.bg} flex-shrink-0 flex items-center justify-center mr-3`}>
              <span className="text-white text-sm font-bold">{category.name.slice(0, 2)}</span>
            </div>
            <div className="flex-grow">
              <h4 className="text-sm font-semibold text-gray-900">{category.name}</h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">{category.count} schools</span>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-primary-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </Link>
    );
  }

  // Render full/standard version
  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className={`relative h-40 ${colorClasses.bg}`}>
        <img 
          src={category.image} 
          alt={category.name} 
          className="w-full h-full object-cover mix-blend-overlay opacity-60"
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${colorClasses.from} ${colorClasses.to}`}></div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-xl font-bold text-white">{category.name}</h3>
          <p className={`${colorClasses.text} text-sm mt-1`}>{category.description.split('.')[0]}</p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-gray-600 mb-4">{category.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">{category.count} schools</span>
          <Link href={`/category?category=${encodeURIComponent(category.name)}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium group-hover:underline flex items-center">
            Explore 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
