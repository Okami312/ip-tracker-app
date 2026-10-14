import { SkeletonLine } from "./Loading";

const CoordsPanel = ({ data, isLoading }) => {
  const location = data
    ? [data.cityName, data.regionName, data.countryName]
        .filter(Boolean)
        .join(", ")
    : "";
  const timezone = data?.timezone ? `UTC ${data.timezone}` : "";

  return (
    <article aria-busy={isLoading}>
      <div>
        <p>IP Address</p>
        <h5>{isLoading ? <SkeletonLine /> : data?.ipAddress}</h5>
      </div>
      <div>
        <p>Location</p>
        <h5>
          {isLoading ? (
            <SkeletonLine />
          ) : (
            <>
              {location}
              {data?.postalCode && ` ${data.postalCode}`}
            </>
          )}
        </h5>
      </div>
      <div>
        <p>Timezone</p>
        <h5>{isLoading ? <SkeletonLine /> : timezone}</h5>
      </div>
      <div>
        <p>ISP</p>
        <h5>{isLoading ? <SkeletonLine /> : data?.asnOrganization}</h5>
      </div>
    </article>
  );
};

export default CoordsPanel;
