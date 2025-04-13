const Error = ({ statusCode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          {statusCode
            ? `Error ${statusCode} en el servidor`
            : 'Error en el cliente'}
        </h1>
        <p className="text-gray-600 text-center mb-6">
          {statusCode
            ? 'Ha ocurrido un error en el servidor. Por favor, inténtelo de nuevo más tarde.'
            : 'Ha ocurrido un error en el navegador. Por favor, inténtelo de nuevo.'}
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 