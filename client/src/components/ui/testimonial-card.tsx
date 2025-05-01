import { Testimonial } from "@/lib/types";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  // Function to render star rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`full-${i}`}
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 2a.75.75 0 01.73.55l1.93 5.94h6.23a.75.75 0 01.435 1.356l-5.03 3.66 1.93 5.94a.75.75 0 01-1.155.82L10 15.76l-5.03 3.66a.75.75 0 01-1.154-.82l1.93-5.94-5.03-3.66A.75.75 0 01.12 8.49h6.23l1.93-5.94A.75.75 0 0110 2zm0 2.093L8.6 8.5H3.26l4.328 3.142L6.22 17.09 10 13.947l3.78 3.142-1.368-5.448L16.74 8.5h-5.34L10 4.093z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <img
          className="h-12 w-12 rounded-full"
          src={testimonial.avatar}
          alt={`${testimonial.name}'s profile picture`}
        />
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">{testimonial.name}</h3>
          <div className="flex items-center">
            {renderStars(testimonial.rating)}
          </div>
        </div>
      </div>
      <blockquote className="text-gray-700 italic">{testimonial.comment}</blockquote>
      <p className="mt-4 text-sm text-gray-500">{testimonial.role}</p>
    </div>
  );
};

export default TestimonialCard;
