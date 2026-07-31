import { Loading } from "../components/Loading.js";
import { useCurrentUser } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";

export const AccountPage = () => {
  const error = useAuthStore((state) => state.error);
  const user = useAuthStore((state) => state.user);
  const currentUser = useCurrentUser(Boolean(user));

  if (!user || currentUser.isLoading) {
    return <Loading />;
  }

  return (
    <section className="panel">
      <h2>Account</h2>
      {error && <p className="status-error">{error}</p>}
      <dl className="health-list">
        <div>
          <dt>Name</dt>
          <dd>{user.fullName}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{user.role}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{user.status}</dd>
        </div>
      </dl>
    </section>
  );
};
