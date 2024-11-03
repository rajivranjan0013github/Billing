import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import tinosRegular from "../../../fonts/Tinos-Regular.ttf";
import tinosBold from "../../../fonts/Tinos-Bold.ttf";
import { HeaderTemplate } from "./LabReportPDF";

// Register fonts
Font.register({
  family: "Tinos",
  fonts: [
    { src: tinosRegular, fontWeight: "normal" },
    { src: tinosBold, fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Tinos",
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "white",
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    color: "#1a5f7a",
    fontWeight: "bold",
  },
  date: {
    fontSize: 10,
    color: "#2c3e50",
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#34495e",
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 10,
   
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  column: {
    flexDirection: "column",
    flexGrow: 1,
    flexBasis: 0,
  },
  label: {
    fontSize: 11,
    color: "black",
    marginRight: 5,
    fontWeight: "bold",
  },
  value: {
    fontSize: 10,
    color: "black",
    marginLeft: 2,
  },
  medicationRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  medicationCell: {
    fontSize: 10,
    color: "#2c3e50",
  },
  vitalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  vitalItem: {
    width: '25%',
    marginBottom: 4,
    paddingRight: 5, // Add right padding to prevent touching adjacent items
  },
  vitalInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginHorizontal:5
  },
  vitalLabel: {
    fontSize: 8,
    color: '#34495e',
    fontWeight: 'bold',
    flexShrink: 1, // Allow label to shrink if needed
    marginRight: 4, // Add a small gap between label and value
  },
  vitalValue: {
    fontSize: 8,
    color: '#2c3e50',
    textAlign: 'right',
    flexShrink: 0, // Prevent value from shrinking
    marginLeft: 4, // Add left margin to separate from label
  },
  subscript: {
    fontSize: 6,
    verticalAlign: 'sub',
  },
  medicationSection: {
    flexDirection: 'row',
    
    justifyContent:"space-between",
    marginBottom: 10,
  },
  medicationTitle: {
    fontSize: 12,
    
    fontWeight: 'bold',
    color: '#34495e',
    width: '15%', // Reduced from 20%
    marginRight: 10, // Add some space between title and list
  },
  medicationList: {
   

    width:"70%",
   
  },
  medicationRow: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  medicationNumber: {
    fontSize: 10,
    color: '#2c3e50',
    width: '5%',
  },
  medicationName: {
    fontSize: 10,
    color: '#2c3e50',
    width: '35%', // Reduced from 40%
  },
  medicationDosage: {
    fontSize: 10,
    color: '#2c3e50',
    width: '20%', // Reduced from 25%
  },
  medicationDuration: {
    fontSize: 10,
    color: '#2c3e50',
    width: '25%', // Reduced from 30%
    textAlign: 'right',
  },
  comorbidityItem: {
    fontSize: 10,
    color: '#2c3e50',
    marginBottom: 2,
  },
});

const OPDPrescriptionPDF = ({ patient, vitals, prescription, labTests,selectedComorbidities,hospital }) => {
    
  const capitalizeAll = (str) => {
    return str.toUpperCase();
  };

  const VitalItem = ({ label, value, unit }) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return (
      <View style={styles.vitalItem}>
        <View style={styles.vitalInner}>
          <Text style={styles.vitalLabel}>
            {label === "O2" ? (
              <>
                O<Text style={styles.subscript}>2</Text>%
              </>
            ) : (
              capitalizeAll(label)
            )}:
          </Text>
          <Text style={styles.vitalValue}>
            {value} {unit}
          </Text>
        </View>
      </View>
    );
  };

  const vitalItems = [
    { label: "Temperature", value: vitals.temperature, unit: "°C" },
    { label: "Heart Rate", value: vitals.heartRate, unit: "bpm" },
    { label: "Blood Pressure", value: vitals.bloodPressure, unit: "mmHg" },
    { label: "Respiratory Rate", value: vitals.respiratoryRate, unit: "bpm" },
    { label: "Height", value: vitals.height, unit: "cm" },
    { label: "Weight", value: vitals.weight, unit: "kg" },
    { label: "BMI", value: vitals.bmi, unit: "" },
    { label: "O2", value: vitals.oxygenSaturation, unit: "%" },
  ];

  const presentVitals = vitalItems.filter(item => 
    item.value !== undefined && item.value !== null && item.value !== ''
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <HeaderTemplate hospital={hospital} />

        <View style={styles.titleContainer}>
          <View style={{ flex: 1 }} /> {/* Empty view for left spacing */}
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>OPD Prescription</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.date}>{format(new Date(), "dd/MM/yyyy")}</Text>
          </View>
        </View>

        {/* Patient Information */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{patient.name}</Text>
              </Text>
            </View>
            <View style={styles.column}>
              <Text>
                <Text style={styles.label}>Age/Gender:</Text>
                <Text style={styles.value}>{`${patient.age} / ${patient.gender}`}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{patient.address}</Text>
              </Text>
            </View>
            <View style={styles.column}>
              <Text>
                <Text style={styles.label}>Contact:</Text>
                <Text style={styles.value}>{patient.contactNumber}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Vitals */}
        {presentVitals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vitals</Text>
            <View style={styles.vitalsContainer}>
              {presentVitals.map((item, index) => (
                <VitalItem key={index} label={item.label} value={item.value} unit={item.unit} />
              ))}
            </View>
          </View>
        )}

       
        {selectedComorbidities && selectedComorbidities.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.row,{alignItems:"baseline"}]}>
              <Text style={[styles.sectionTitle, { marginRight: 5 }]}>Comorbidities:</Text>
              <Text style={styles.sectionContent}>
                {selectedComorbidities.map(comorbidity => comorbidity.name).join(', ')}
              </Text>
            </View>
          </View>
        )}

       
        {prescription.diagnosis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <Text style={styles.sectionContent}>{prescription.diagnosis}</Text>
          </View>
        )}

        {/* Treatment */}
        {prescription.treatment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment</Text>
            <Text style={styles.sectionContent}>{prescription.treatment}</Text>
          </View>
        )}

        {/* Medications */}
        {prescription.medications && prescription.medications.length > 0 && (
          <>
            {prescription.medications.filter(med => med.name).length > 0 && (
              <View style={styles.medicationSection}>
                <Text style={styles.medicationTitle}>Medications</Text>
                <View style={styles.medicationList}>
                  {prescription.medications
                    .filter(med => med.name)
                    .map((med, index) => (
                      <View key={index} style={styles.medicationRow}>
                        <Text style={styles.medicationNumber}>{index + 1}.</Text>
                        <Text style={styles.medicationName}>{med.name}</Text>
                        <Text style={styles.medicationDosage}>{med.frequency}</Text>
                        <Text style={styles.medicationDuration}>
                          {med.duration} {med.duration === '1' ? 'day' : 'days'}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Lab Tests */}
        {labTests && labTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Lab Tests</Text>
            {labTests.map((test, index) => (
              <Text key={index} style={styles.sectionContent}>
                • {test.name}
              </Text>
            ))}
          </View>
        )}

        {/* Additional Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Instructions</Text>
          <Text style={styles.sectionContent}>
            {prescription.additionalInstructions}
          </Text>
        </View>

        {/* Doctor's Signature */}
        <View style={{ marginTop: 20, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 10 }}>Doctor's Signature</Text>
        </View>
      </Page>
    </Document>
  );
};

export default OPDPrescriptionPDF;