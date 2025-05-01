import { useState } from "react";
import { FAQ } from "@/lib/types";
import { ChevronDown } from "lucide-react";

interface FAQItemProps {
  faq: FAQ;
}

const FAQItem = ({ faq }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        className="flex justify-between items-center w-full px-4 py-3 text-left text-gray-800 font-medium hover:bg-gray-50 focus:outline-none"
        onClick={toggleOpen}
      >
        <span>{faq.question}</span>
        <ChevronDown 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          size={18} 
        />
      </button>
      <div className={`px-4 pb-4 ${isOpen ? '' : 'hidden'}`}>
        <p className="text-gray-600">{faq.answer}</p>
      </div>
    </div>
  );
};

export default FAQItem;
