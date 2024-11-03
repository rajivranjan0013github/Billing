import { stylesFont } from "../../components/custom/reports/LabReportPDF";
import { useSelector } from "react-redux";

const HospitalHeader = () => {
  const { hospitalInfo } = useSelector((state) => state.hospital);
  return (
    <div className="mb-2 border-b border-[#000000] pb-2">
      <div>
        <h1
          className="text-4xl tracking-wide text-center text-[#1a5f7a] uppercase"
          style={stylesFont.fontFamilyName}
        >
          {hospitalInfo?.name}
        </h1>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ marginLeft: 50 }}>
          <img
            src={require("../../components/custom/reports/Capture2.png")}
            alt="Clinic Logo"
            className="w-[100px] h-[100px]"
          />
        </div>
        <div className="ml-8">
          <p className="text-center text-[#333333]">{hospitalInfo?.address}</p>
          <h2 className="text-center text-[#1a5f7a] text-xl ">
            {hospitalInfo?.doctorName}
          </h2>
          <p className="text-center text-[#333333]">
            {hospitalInfo?.doctorInfo}
          </p>
          <p className="text-center text-[#333333]">
            Mob : {hospitalInfo?.contactNumber}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HospitalHeader;
