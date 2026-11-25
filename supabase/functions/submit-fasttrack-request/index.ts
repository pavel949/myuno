// A versioned endpoint: old deployments cannot accidentally accept the retry.
// Reuse the exact authenticated atomic writer, not a second booking path.
import '../notify-fasttrack-booking/index.ts';
