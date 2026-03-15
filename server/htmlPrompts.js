export const htmlPrompts = [
  {
    name: "User Profile Card",
    html: `<div class="card">
  <div class="card-image"></div>
  <div class="card-content">
    <h2>John Doe</h2>
    <p>Senior Fullstack Developer</p>
    <div class="tags">
      <span>React</span>
      <span>Node.js</span>
      <span>CSS</span>
    </div>
    <button>Contact Me</button>
  </div>
</div>`
  },
  {
    name: "Login Form",
    html: `<form class="login-form">
  <h2>Welcome Back</h2>
  <div class="input-group">
    <label>Email</label>
    <input type="email" placeholder="you@example.com" />
  </div>
  <div class="input-group">
    <label>Password</label>
    <input type="password" placeholder="••••••••" />
  </div>
  <button type="submit">Log In</button>
  <p class="forgot">Forgot password?</p>
</form>`
  },
  {
    name: "Blog Post",
    html: `<article class="blog-post">
  <header class="post-header">
    <div class="category">Technology & Design</div>
    <h1>The Renaissance of Vertical Interfaces</h1>
    <div class="metadata">
      <span class="author">By Sarah Drasner</span>
      <span class="divider">•</span>
      <span class="read-mini">12 min read</span>
    </div>
  </header>
  
  <div class="hero-image"></div>
  
  <section class="content">
    <p class="lead">As mobile devices continue to dominate our daily digital interactions, the way we perceive and build for the web is undergoing a fundamental shift.</p>
    
    <h2>The Scroll is King</h2>
    <p>We've moved past the "above the fold" obsession. Modern users are natural scrollers, seeking a narrative flow rather than a static snapshot. This opens up incredible storytelling opportunities for developers who can master the rhythm of a long-form page.</p>
    
    <blockquote>
      "Design is not just what it looks like and feels like. Design is how it works."
    </blockquote>
    
    <h2>Micro-Interactions in Typography</h2>
    <p>It's no longer just about choosing a font. It's about how that font breathes. Use variable fonts to adjust weight dynamically based on scroll position, or subtle transitions when a user selects a block of text.</p>
  </section>
  
  <footer class="post-footer">
    <div class="share-links">
      <button>Share on X</button>
      <button>Copy Link</button>
    </div>
  </footer>
</article>`
  },
  {
    name: "Product Spotlight",
    html: `<div class="product-card">
  <div class="badge">New Release</div>
  <div class="product-thumb"></div>
  <div class="product-info">
    <div class="category">Audio Devices</div>
    <h3>Pro Wireless Headphones</h3>
    <p class="price">$299.00</p>
    <ul class="features">
      <li>Noise Cancelling</li>
      <li>40h Battery Life</li>
      <li>Spatial Audio</li>
    </ul>
    <button class="add-cart">Add to Cart</button>
  </div>
</div>`
  },
  {
    name: "Dashboard Sidebar",
    html: `<nav class="sidebar">
  <div class="logo">AppShell</div>
  <ul class="nav-links">
    <li class="active"><span class="icon"></span> Overview</li>
    <li><span class="icon"></span> Analytics</li>
    <li><span class="icon"></span> Projects</li>
    <li><span class="icon"></span> Team</li>
    <li><span class="icon"></span> Settings</li>
  </ul>
  <div class="user-pill">
    <div class="avatar"></div>
    <div class="user-name">Alex Smith</div>
  </div>
</nav>`
  },
  {
    name: "Pricing Table",
    html: `<div class="pricing-card highlighted">
  <div class="tier">Professional</div>
  <div class="price">
    <span class="currency">$</span>
    <span class="amount">49</span>
    <span class="period">/mo</span>
  </div>
  <p class="description">Perfect for growing startups and medium teams.</p>
  <ul class="checklist">
    <li>Unlimited Projects</li>
    <li>Advanced Analytics</li>
    <li>24/7 Priority Support</li>
    <li>Custom Domains</li>
  </ul>
  <button class="cta-button">Choose Pro</button>
</div>`
  },
  {
    name: "Music Player UI",
    html: `<div class="player">
  <div class="cover-art"></div>
  <div class="track-info">
    <div class="title">Midnight City</div>
    <div class="artist">Synthwave Collective</div>
  </div>
  <div class="progress-bar">
    <div class="fill"></div>
  </div>
  <div class="controls">
    <button class="prev">⏮</button>
    <button class="play-pause">▶</button>
    <button class="next">⏭</button>
  </div>
  <div class="volume">
    <span>🔉</span>
    <input type="range" />
  </div>
</div>`
  },
  {
    name: "Hero Section",
    html: `<section class="hero">
  <div class="hero-content">
    <h1>Design the Future <span>Faster</span></h1>
    <p>Collaborate with your team in real-time and build stunning interfaces with our new design system.</p>
    <div class="actions">
      <button class="primary">Get Started</button>
      <button class="secondary">View Demo</button>
    </div>
    <div class="social-proof">
      <p>Trusted by 10k+ designers</p>
    </div>
  </div>
  <div class="hero-graphic"></div>
</section>`
  },
  {
    name: "Newsletter Signup",
    html: `<div class="newsletter-box">
  <div class="icon-header">📩</div>
  <h3>Weekly Design Inspiration</h3>
  <p>Join 50,000+ developers receiving our curated list of resources every Monday morning.</p>
  <form class="signup-row">
    <input type="email" placeholder="Enter your email" required />
    <button type="submit">Subscribe</button>
  </form>
  <p class="spam-notice">No spam, ever. Unsubscribe with one click.</p>
</div>`
  },
  {
    name: "User Notification Feed",
    html: `<div class="notification-center">
  <header>
    <h3>Notifications</h3>
    <button class="mark-all">Mark all as read</button>
  </header>
  <div class="feed">
    <div class="item unread">
      <div class="dot"></div>
      <div class="content">
        <p><strong>Sarah Chen</strong> mentioned you in a comment.</p>
        <span class="time">2m ago</span>
      </div>
    </div>
    <div class="item">
      <div class="content">
        <p>Project <strong>Bauhaus Retro</strong> was successfully deployed.</p>
        <span class="time">1h ago</span>
      </div>
    </div>
    <div class="item">
      <div class="content">
        <p>You have a meeting with <strong>Design Team</strong> at 3:00 PM.</p>
        <span class="time">3h ago</span>
      </div>
    </div>
  </div>
</div>`
  },
  {
    name: "Classic Recipe Card",
    html: `<div class="recipe-card">
  <div class="recipe-badge">Chef's Choice</div>
  <div class="recipe-hero"></div>
  <div class="recipe-main">
    <div class="meta-row">
      <span>⏱ 45 Min</span>
      <span>🔥 Medium</span>
      <span>👤 Serves 4</span>
    </div>
    <h1>Rustic Tomato Basil Pasta</h1>
    <p class="desc">A simple, soul-warming Italian classic made with vine-ripened tomatoes and fresh garden herbs.</p>
    
    <h3>Ingredients</h3>
    <ul class="ingredients">
      <li><span>500g</span> Spaghetti</li>
      <li><span>6 large</span> Roma Tomatoes</li>
      <li><span>1 bunch</span> Fresh Basil</li>
      <li><span>3 cloves</span> Garlic</li>
    </ul>
    
    <button class="start-cooking">Start Cooking</button>
  </div>
</div>`
  },
  {
    name: "Event Ticket",
    html: `<div class="ticket">
  <div class="ticket-left">
    <div class="event-name">Neon Dreams Tour</div>
    <div class="performer">The Synthwave Collective</div>
    <div class="venue">Grand Central Arena, NYC</div>
    <div class="ticket-details">
      <div class="detail">
        <label>Date</label>
        <div>Oct 24, 2024</div>
      </div>
      <div class="detail">
        <label>Section</label>
        <div>A2</div>
      </div>
      <div class="detail">
        <label>Seat</label>
        <div>14-15</div>
      </div>
    </div>
  </div>
  <div class="ticket-right">
    <div class="barcode"></div>
    <div class="ticket-num">#8829-X</div>
  </div>
</div>`
  },
  {
    name: "Social Media Post",
    html: `<div class="social-post">
  <header class="post-top">
    <div class="author-avatar"></div>
    <div class="author-meta">
      <div class="author-name">Studio Ghibli</div>
      <div class="post-time">Published in Kyoto • 4h</div>
    </div>
    <button class="options">•••</button>
  </header>
  
  <div class="post-media"></div>
  
  <div class="post-actions">
    <div class="left-actions">
      <button class="like-btn">❤</button>
      <button class="comment-btn">💬</button>
      <button class="share-btn">↗</button>
    </div>
    <button class="save-btn">🔖</button>
  </div>
  
  <div class="post-content">
    <p><strong>Studio Ghibli</strong> The morning light filters through the workshop windows, marking another day of wonder. 🌸 #Ghibli #Animation</p>
  </div>
</div>`
  },
  {
    name: "Checkout Summary",
    html: `<div class="checkout-summary">
  <h2>Order Summary</h2>
  <div class="cart-items">
    <div class="item">
      <span class="name">Wireless Keyboard</span>
      <span class="price">$129.00</span>
    </div>
    <div class="item">
      <span class="name">Ergonomic Mouse</span>
      <span class="price">$89.00</span>
    </div>
    <div class="item">
      <span class="name">Shipping</span>
      <span class="price free">FREE</span>
    </div>
  </div>
  <div class="tax-row">
    <span>Estimated Tax</span>
    <span>$18.42</span>
  </div>
  <div class="total-row">
    <span>Total</span>
    <span class="total-price">$236.42</span>
  </div>
  <button class="checkout-btn">Proceed to Payment</button>
  <p class="secure-notice">🔒 Secure Checkout Guaranteed</p>
</div>`
  },
  {
    name: "Mini FAQ Section",
    html: `<div class="faq-section">
  <div class="header">
    <h1>Common Questions</h1>
    <p>Everything you need to know about the product and billing.</p>
  </div>
  <div class="faq-list">
    <details class="faq-item" open>
      <summary>How does the 14-day free trial work?</summary>
      <div class="answer">You get full access to all premium features without needing a credit card for the first two weeks.</div>
    </details>
    <details class="faq-item">
      <summary>Can I cancel my subscription anytime?</summary>
      <div class="answer">Yes, you can cancel your plan directly from the dashboard setting with a single click.</div>
    </details>
    <details class="faq-item">
      <summary>Do you offer student discounts?</summary>
      <div class="answer">We offer a 50% discount for anyone currently enrolled in an accredited academic institution.</div>
    </details>
  </div>
</div>`
  }
];
