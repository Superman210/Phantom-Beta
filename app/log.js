const winston = require('winston');

winston.loggers.add('no-host', {
  console: {
    level: 'info',
    colorize: true,
    label: 'no hostname'
  },
  file: {
    'filename': '../log-no-host.log'
  }
});

winston.loggers.add('no-ip', {
  console: {
    level: 'info',
    colorize: true,
    label: 'no ip'
  },
  file: {
    'filename': '../log-no-ip.log'
  }
});

winston.loggers.add('conversion', {
  console: {
    level: 'info',
    colorize: true,
    label: 'conversion'
  },
  file: {
    'filename': '../log-conversion.log'
  }
});

winston.loggers.add('conversion', {
  console: {
    level: 'info',
    colorize: true,
    label: 'conversion'
  },
  file: {
    'filename': '../log-conversion.log'
  }
});

winston.loggers.add('segfault', {
  console: {
    level: 'info',
    colorize: true,
    label: 'filter'
  },
  file: {
    'filename': '../segfault.log'
  }
});

winston.loggers.add('filter', {
  console: {
    level: 'info',
    colorize: true,
    label: 'filter'
  },
  file: {
    'filename': '../filter.log'
  }
});

winston.loggers.add('weirdreq', {
  console: {
    level: 'info',
    colorize: true,
    label: 'weirdreq'
  },
  file: {
    'filename': '../weirdreq.log'
  }
});

module.exports.noHost = winston.loggers.get('no-host');
module.exports.noIP = winston.loggers.get('no-ip');
module.exports.filter = winston.loggers.get('filter');
module.exports.conversion = winston.loggers.get('conversion');
module.exports.segfault = winston.loggers.get('segfault');

module.exports.logIfError = err => {
  if (err) console.error(err);
}