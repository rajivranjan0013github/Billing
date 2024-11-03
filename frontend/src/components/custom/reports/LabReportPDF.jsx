import React from 'react';
import { useSelector } from 'react-redux';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import tinosRegular from '../../../fonts/Tinos-Regular.ttf';
import tinosBold from '../../../fonts/Tinos-Bold.ttf';
import nabhLogo from './nabh.png';

Font.register({
    family: "Tinos",
    fonts: [
        { src: tinosRegular, fontWeight: "normal" },
        { src: tinosBold, fontWeight: "bold" },
    ],
  });

export const stylesFont = StyleSheet.create({
  fontFamilyName : {
    fontFamily: "Tinos",
  }
});
  

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Tinos',
    paddingHorizontal: 30,
    paddingTop: 10,
    backgroundColor: "white",
  },
  
  header: {
    marginBottom: 2,
    borderBottom: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
  },
  clinicName: {
    fontSize: 26,
    textAlign: "center",
    fontFamily: "Tinos",
    // Use "bold" instead of "bolder"
    marginBottom: 5,
    color: "#1a5f7a",
  },
  clinicInfo: {
    fontSize: 10,
    textAlign: "center",
    color: "#333333",
  },
  doctorInfo: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    letterSpacing: 2,
    color: "#1a5f7a",
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 3,
    color: '#34495e',
  },
  reportContainer: {
    marginTop: 10,
  },
  reportRow: {
    flexDirection: 'row',
    borderBottomColor: '#ecf0f1',
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  testName: {
    width: '30%',
    fontSize: 12,

    color: '#2c3e50',
  },
  testValue: {
    width: '25%',
    fontSize: 12,
    
    color: '#3498db',
  },
  testUnit: {
    width: '20%',
    fontSize: 12,
    color: '#7f8c8d',
  },
  testRange: {
    width: '25%',
    fontSize: 12,
    color: '#7f8c8d',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#95a5a6',
  },
  patientDetails: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  patientColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  patientInfo: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  patientLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34495e',
    marginRight: 5,
  },
  patientValue: {
    fontSize: 10,
    color: '#2c3e50',
  },
});

export const HeaderTemplate = ({ hospital }) => {
  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.clinicName}>{hospital.name}</Text>
        </View>
        <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ marginLeft: 50 }}>
            <Image
              src={hospital.logo}
              style={{ width: 70 }}
            />
          </View>
          <View style={{ position: "absolute", width: "100%" }}>
            <Text style={styles.clinicInfo}>
              {hospital.address}
            </Text>
            <Text style={styles.doctorInfo}>{hospital.doctorName}</Text>
            <Text style={styles.clinicInfo}>
              {hospital.doctorInfo}
            </Text>
            <Text style={styles.clinicInfo}>Consultant Urologist</Text>
            <Text style={styles.clinicInfo}>Mob : {hospital.contactNumber}</Text>
          </View>
          <View style={{ marginRight: 50 }}>
            <Image
              src={nabhLogo}
              style={{ height: 70 }}
            />
          </View>
        </View>
      </View>
    </>
  )
}   

const PatientDetailsTemplate = ({ patientData, reportData }) => {
  return (
    <View style={styles.patientDetails}>
      <View style={styles.patientColumn}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Name:</Text>
          <Text style={styles.patientValue}>{patientData?.patientName}</Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Age:</Text>
          <Text style={styles.patientValue}>{patientData?.patient?.age}</Text>
        </View>
      </View>
      <View style={styles.patientColumn}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Gender:</Text>
          <Text style={styles.patientValue}>{patientData?.patient?.gender}</Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Reg No:</Text>
          <Text style={styles.patientValue}>{patientData?.registrationNumber}</Text>
        </View>
      </View>
      <View style={styles.patientColumn}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Contact:</Text>
          <Text style={styles.patientValue}>{patientData?.contactNumber}</Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientLabel}>Date:</Text>
          <Text style={styles.patientValue}>{format(reportData?.date, 'dd/MM/yyyy')}</Text>
        </View>
      </View>
    </View>
  );
};

const LabReportPDF = ({ reportData, patientData,hospital }) => {
  const reportEntries = Object.entries(reportData.report);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <HeaderTemplate hospital={hospital} />
        <PatientDetailsTemplate patientData={patientData} reportData={reportData} />
        
        <View style={styles.reportContainer}>
          {reportEntries.map(([key, value]) => (
            <View style={styles.reportRow} key={key}>
              <Text style={styles.testName}>{key}</Text>
              <Text style={styles.testValue}>{value.value}</Text>
              <Text style={styles.testUnit}>{value.unit}</Text>
              <Text style={styles.testRange}>{value.normalRange}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default LabReportPDF;
