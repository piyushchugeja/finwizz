import { useState } from 'react';

const FinancialProfileForm = () => {
  const [formData, setFormData] = useState({
    occupation: '',
    ageGroup: '',
    monthlyIncome: '',
    financialGoal: '',
    riskAppetite: '',
  });

  // Handle change in form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);
    // Here you can process the data as required, e.g., save it to the backend.
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg max-w-lg mx-auto mt-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">Financial Profile Form</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Occupation Field */}
        <div>
          <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
            Occupation
          </label>
          <input
            type="text"
            id="occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm"
            required
            placeholder="Enter your occupation"
          />
        </div>

        {/* Age Group Selection */}
        <div>
          <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">
            Age Group
          </label>
          <select
            id="ageGroup"
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm"
            required
          >
            <option value="">Select Age Group</option>
            <option value="18-25">18-25</option>
            <option value="26-35">26-35</option>
            <option value="36-45">36-45</option>
            <option value="46-60">46-60</option>
            <option value="60+">60+</option>
          </select>
        </div>

        {/* Monthly Income Field */}
        <div>
          <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">
            Monthly Income (in USD)
          </label>
          <input
            type="number"
            id="monthlyIncome"
            name="monthlyIncome"
            value={formData.monthlyIncome}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm"
            required
            placeholder="Enter your monthly income"
          />
        </div>

        {/* Financial Goal Field */}
        <div>
          <label htmlFor="financialGoal" className="block text-sm font-medium text-gray-700">
            Financial Goal
          </label>
          <input
            type="text"
            id="financialGoal"
            name="financialGoal"
            value={formData.financialGoal}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm"
            required
            placeholder="Enter your financial goal"
          />
        </div>

        {/* Risk Appetite Selection */}
        <div>
          <label htmlFor="riskAppetite" className="block text-sm font-medium text-gray-700">
            Risk Appetite
          </label>
          <select
            id="riskAppetite"
            name="riskAppetite"
            value={formData.riskAppetite}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm"
            required
          >
            <option value="">Select Risk Appetite</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialProfileForm;
