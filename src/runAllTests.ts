/**
 * MED-COMMAND Unified Test Runner
 * Executes all 5 test suites in a single high-performance Node process
 */

async function runAll() {
  console.log('======================================================');
  console.log('MED-COMMAND UNIFIED TEST RUNNER: ALL TEST SUITES');
  console.log('======================================================\n');

  try {
    await import('./firebase/utils/sanitize.test');
    await import('./firebase/services/unitSave.test');
    await import('./firebase/services/accessRequest.test');
    await import('./firebase/services/officerGps.test');
    await import('./components/common/tacticalVehicle.test');
    await import('./utils/geoDonut.test');
    await import('./firebase/services/referralHospital.test');

    console.log('\n======================================================');
    console.log('ALL 7 TEST SUITES COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test Runner encountered an error:', err);
    process.exit(1);
  }
}

runAll();
