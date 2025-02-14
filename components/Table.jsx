function Table({ data, onIncrement, pinVerified }) {
  const total = data.reduce((sum, pack) => sum + pack.opened, 0);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Pack Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Number Opened
            </th>
            <th className="px-6 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {data.map((pack, index) => (
            <tr key={pack.name} className={
              index % 2 === 0 
                ? 'bg-yellow-50 dark:bg-gray-800' 
                : 'bg-yellow-100 dark:bg-gray-700'
            }>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {pack.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {pack.opened}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onIncrement(index)}
                  className={`${
                    pinVerified 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  } text-white px-3 py-1 rounded-lg transition-colors`}
                >
                  +
                </button>
              </td>
            </tr>
          ))}
          <tr className="bg-green-100 dark:bg-green-900 font-bold">
            <td className="px-6 py-4 dark:text-gray-100">TOTAL OPENED:</td>
            <td className="px-6 py-4 dark:text-gray-100">{total}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

window.Components = {
  ...window.Components,
  Table
};