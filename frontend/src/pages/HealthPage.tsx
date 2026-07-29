import { useEffect } from "react";
import { Loading } from "../components/Loading.js";
import { useAppDispatch, useAppSelector } from "../hooks/storeHooks.js";
import { fetchHealth } from "../store/healthSlice.js";

export const HealthPage = () => {
  const dispatch = useAppDispatch();
  const { data, error, status } = useAppSelector((state) => state.health);

  useEffect(() => {
    void dispatch(fetchHealth());
  }, [dispatch]);

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "failed") {
    return (
      <section className="panel">
        <h2>API Health</h2>
        <p className="status-error">{error}</p>
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
