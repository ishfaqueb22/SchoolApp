import SmartSearchCard from "./SmartSearchCard";
import SmartSuggestionCard from "./SmartSuggestionCard";

const AIMatchingSection = () => {
  return (
    <section className="mb-16" id="ai-matching">
      <div className="space-y-12">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Intelligent School Discovery Tools</h2>
          <p className="text-gray-600 mt-2">Use our AI-powered tools to find the perfect school for your child</p>
        </div>
        <SmartSearchCard />
        <SmartSuggestionCard />
      </div>
    </section>
  );
};

export default AIMatchingSection;
