// Test script for /api/simplify-phrase endpoint
// Run with: node test-simplify-phrase.js

const API_URL = 'https://aleta-stairless-nguyet.ngrok-free.dev/api/simplify-phrase';

// Test cases
const testCases = [
  {
    name: 'Complex political phrase',
    paragraph: 'In a rapidly evolving technological landscape, organizations must continuously adapt to new challenges while maintaining efficiency and innovation. Artificial intelligence is transforming industries by enabling smarter decision-making, automating repetitive tasks, and enhancing user experiences. However, successful implementation requires careful planning, ethical considerations, and a deep understanding of both the technology and its potential impact on society.',
    phrase: 'successful implementation requires careful planning, ethical considerations, and a deep understanding',
  },
  {
    name: 'Technical jargon',
    paragraph: 'The archipelago has been a disputed territory for decades, with multiple nations asserting sovereignty over the islands. Maritime navigation in the region has become increasingly complex due to military installations and reclamation projects.',
    phrase: 'asserting sovereignty over the islands',
  },
  {
    name: 'Academic language',
    paragraph: 'The research methodology employed a mixed-methods approach, combining quantitative analysis with qualitative interviews to provide comprehensive insights into the phenomenon under investigation.',
    phrase: 'mixed-methods approach, combining quantitative analysis with qualitative interviews',
  },
];

async function testSimplifyPhrase(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${testCase.name}`);
  console.log('='.repeat(80));
  console.log('\nParagraph:');
  console.log(testCase.paragraph);
  console.log('\nPhrase to simplify:');
  console.log(`"${testCase.phrase}"`);
  console.log(`Length: ${testCase.phrase.length} characters`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paragraph: testCase.paragraph,
        phrase: testCase.phrase,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('\n❌ ERROR:', error);
      return;
    }

    const data = await response.json();

    console.log('\n✅ SUCCESS!');
    console.log('\nOriginal Phrase:');
    console.log(`"${data.originalPhrase}"`);
    console.log(`Length: ${data.originalLength} characters`);
    
    console.log('\nSimplified Phrase:');
    console.log(`"${data.simplifiedPhrase}"`);
    console.log(`Length: ${data.simplifiedLength} characters`);
    
    console.log('\nExplanation:');
    console.log(data.explanation);
    
    console.log('\nMetadata:');
    console.log(`Source: ${data.source}`);
    console.log(`Length change: ${data.simplifiedLength - data.originalLength} characters (${((data.simplifiedLength / data.originalLength - 1) * 100).toFixed(1)}%)`);

  } catch (error) {
    console.error('\n❌ FETCH ERROR:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting phrase simplification tests...\n');

  for (const testCase of testCases) {
    await testSimplifyPhrase(testCase);
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✨ All tests completed!');
  console.log('='.repeat(80));
}

// Run tests
runAllTests().catch(console.error);
