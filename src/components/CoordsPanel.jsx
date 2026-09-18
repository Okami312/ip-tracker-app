const CoordsPanel = ({ data }) => {
  const location = data
    ? [data.cityName, data.regionName, data.countryName]
        .filter(Boolean)
        .join(", ")
    : "";
  const timezone = data?.timeZones?.[0];

  return (
    <article>
      <div>
        <p>IP address</p>
        <h5>{data?.ipAddress}</h5>
      </div>
      <div className="border">
        <p>Location</p>
        <h5>{location}</h5>
      </div>
      <div className="border">
        <p>Timezone</p>
        <h5>{timezone}</h5>
      </div>
      <div className="border">
        <p>ISP</p>
        <h5>{data?.asnOrganization}</h5>
      </div>
    </article>
  );
};

export default CoordsPanel;
