# CNS Node

## Table of Contents

- [About](#about)
- [Installing](#installing)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [License](#license)
- [Copyright Notice](#copyright-notice)

## About

This project contains a [Node.js](https://en.wikipedia.org/wiki/Node.js) application used in conjunction with a `cns-broker`. When run, the simulator publishes itself to the broker, the broker then connects node contexts together using connection profiles and publishes the connections back to the node. The application works on any POSIX-compliant shell (sh, dash, ksh, zsh, bash), in particular on these platforms: unix, linux, macOS, and Windows WSL.

## Installing

To **install** or **update** the application, you should fetch the latest version from this Git repository. To do that, you may either download and unpack the repo zip file, or clone the repo using:

```sh
git clone https://github.com/cnscp/cns-simulator.git
```

Either method should get you a copy of the latest version. It is recommended (but not compulsory) to place the repo in the `~/cns-simulator` project directory. Go to the project directory and install Node.js dependancies with:

```sh
npm install
```

Your application should now be ready to rock.

## Usage

Once installed, run the application with:

```sh
npm run start
```

To shut down the application, hit `ctrl-c`.

You can change settings from inside of [config.json](./config.json).
The identity of the simulator is held in [identity.json](./identity.json).
The information published to the broker is held in [persist.json](./persist.json).

## Maintainers

This project contains two environments, one for Staging (development) and one for Production. It is recommended to push changes to Staging, test those changes, then deploy them to Production.

### Pushing to Staging

Push changes to Staging environment with:

```sh
npm run push
```

The version patch number in `package.json` will automatically be incremented.

### Deploying to Production

Deploy Staging changes to Production environment with:

```sh
npm run deploy
```

The version minor number in `package.json` will automatically be incremented and the patch number reset.

## License

See [LICENSE.md](./LICENSE.md).

## Copyright Notice

See [COPYRIGHT.md](./COPYRIGHT.md).
