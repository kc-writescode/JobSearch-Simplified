// Quick test script to debug job import
// Run with: npx tsx test-import.ts

const testUrl = 'https://jobright.ai/jobs/info/692669bb27bf2f41a2c45f02';

async function testImport() {
    try {
        console.log('Testing job import for:', testUrl);

        const response = await fetch('http://localhost:3000/api/jobs/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // You may need to add auth headers if testing locally
            },
            body: JSON.stringify({ url: testUrl }),
        });

        const data = await response.json();

        console.log('\nResponse Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('\n❌ Import failed');
            console.error('Error:', data.error);
            if (data.details) console.error('Details:', data.details);
        } else {
            console.log('\n✅ Import successful');
            console.log('Job:', data.data?.title, '@', data.data?.company);
            console.log('Status:', data.data?.status);
            console.log('Delegated:', data.delegated);
        }
    } catch (error) {
        console.error('\n💥 Request failed:', error);
    }
}

testImport();
