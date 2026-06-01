export type WelcomeMailContext = {
  name?: string | null;
  loginUrl: string;
};

export type TestSentMailContext = {
  name?: string | null;
  jobTitle: string;
  applicationsUrl: string;
};

export type RejectedMailContext = {
  name?: string | null;
  jobTitle: string;
};

export type InterviewMailContext = {
  name?: string | null;
  jobTitle: string;
  applicationsUrl: string;
};

function greeting(name?: string | null): string {
  return name?.trim() ? `Hi ${name.trim()},` : 'Hi,';
}

export function welcomeEmail(ctx: WelcomeMailContext) {
  const subject = 'Welcome to Hire Flow';
  const text = `${greeting(ctx.name)}

Your candidate account is ready. Sign in to browse jobs and apply:

${ctx.loginUrl}

— Hire Flow`;
  const html = `<p>${greeting(ctx.name)}</p>
<p>Your candidate account is ready. <a href="${ctx.loginUrl}">Sign in</a> to browse jobs and apply.</p>
<p>— Hire Flow</p>`;
  return { subject, text, html };
}

export function testSentEmail(ctx: TestSentMailContext) {
  const subject = `Assessment ready: ${ctx.jobTitle}`;
  const text = `${greeting(ctx.name)}

HR has sent you an assessment for ${ctx.jobTitle}. Sign in to complete it:

${ctx.applicationsUrl}

— Hire Flow`;
  const html = `<p>${greeting(ctx.name)}</p>
<p>HR has sent you an assessment for <strong>${ctx.jobTitle}</strong>. <a href="${ctx.applicationsUrl}">View your applications</a> to start the test.</p>
<p>— Hire Flow</p>`;
  return { subject, text: text.replace(/<[^>]+>/g, ''), html };
}

export function rejectedEmail(ctx: RejectedMailContext) {
  const subject = `Update on your application — ${ctx.jobTitle}`;
  const text = `${greeting(ctx.name)}

Thank you for your interest in ${ctx.jobTitle}. After review, we will not be moving forward with your application at this time.

— Hire Flow`;
  const html = `<p>${greeting(ctx.name)}</p>
<p>Thank you for your interest in <strong>${ctx.jobTitle}</strong>. After review, we will not be moving forward with your application at this time.</p>
<p>— Hire Flow</p>`;
  return { subject, text, html };
}

export function interviewEmail(ctx: InterviewMailContext) {
  const subject = `Next step: interview — ${ctx.jobTitle}`;
  const text = `${greeting(ctx.name)}

Good news — you have been shortlisted for the next phase for ${ctx.jobTitle}. Our team will follow up with interview details.

You can also check your portal: ${ctx.applicationsUrl}

— Hire Flow`;
  const html = `<p>${greeting(ctx.name)}</p>
<p>Good news — you have been shortlisted for the next phase for <strong>${ctx.jobTitle}</strong>. Our team will follow up with interview details.</p>
<p><a href="${ctx.applicationsUrl}">View your applications</a></p>
<p>— Hire Flow</p>`;
  return { subject, text, html };
}
