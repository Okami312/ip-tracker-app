import { SkeletonLine } from "./Loading";

const CoordsPanel = ({ data, isLoading }) => {
  const location = data
    ? [data.cityName, data.regionName, data.countryName]
        .filter(Boolean)
        .join(", ")
    : "";
  const timezone = data?.timezone ? `UTC ${data.timezone}` : "";

  return (
    <article className="info-card" aria-busy={isLoading}>
      <dl className="info-list">
        <div className="info-item">
          <dt className="info-label">IP Address</dt>
          <dd className="info-value">
            {isLoading ? <SkeletonLine /> : data?.ipAddress}
          </dd>
        </div>
        <div className="info-item">
          <dt className="info-label">Location</dt>
          <dd className="info-value">
            {isLoading ? (
              <SkeletonLine />
            ) : (
              <>
                {location}
                {data?.postalCode && ` ${data.postalCode}`}
              </>
            )}
          </dd>
        </div>
        <div className="info-item">
          <dt className="info-label">Timezone</dt>
          <dd className="info-value">
            {isLoading ? <SkeletonLine /> : timezone}
          </dd>
        </div>
        <div className="info-item">
          <dt className="info-label">ISP</dt>
          <dd className="info-value">
            {isLoading ? <SkeletonLine /> : data?.asnOrganization}
          </dd>
        </div>
      </dl>
    </article>
  );
};

export default CoordsPanel;
