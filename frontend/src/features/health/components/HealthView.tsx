import { Loading } from "../../../components/feedback/Loading.js";
import { useHealthQuery } from "../hooks/useHealthQuery.js";

export const HealthView = () => {
  const { data, error, isError, isLoading } = useHealthQuery();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <section className="panel">
        <h2>API Health</h2>
        <p className="status-error">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>API Health</h2>
      {data ? (
        <dl className="health-list">
          <div>
            <dt>API status</dt>
            <dd>{data.status}</dd>
          </div>
          <div>
            <dt>Database</dt>
            <dd>{data.database}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{data.environment}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{data.timestamp}</dd>
          </div>
        </dl>
      ) : (
        <p>No health data available.</p>
      )}
    </section>
  );
};
