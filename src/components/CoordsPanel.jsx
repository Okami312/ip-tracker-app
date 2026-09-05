const CoordsPanel = ({ data }) => {
  return (
    <article>
      <div>
        <p>IP address</p>
        <h5>{data?.ipAddress}</h5>
      </div>
      <div className="border">
        <p>Location</p>
        <h5>{data?.location}</h5>
      </div>
      <div className="border">
        <p>Timezone</p>
        <h5>{data?.timezones}</h5>
      </div>
      <div className="border">
        <p>ISP</p>
        <h5>{data?.isp}</h5>
      </div>
    </article>
  );
};

export default CoordsPanel;
