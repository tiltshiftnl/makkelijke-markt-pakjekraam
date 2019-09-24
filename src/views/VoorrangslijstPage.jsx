const React = require('react');
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerList = require('./components/OndernemerList.tsx');
const PrintPage = require('./components/PrintPage');
const PropTypes = require('prop-types');
const { paginate } = require('../util');
const { A_LIJST_DAYS } = require('../domain-knowledge.js');

import Indeling from '../allocation/indeling';
import Ondernemers from '../allocation/ondernemers';

class VoorrangslijstPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        aLijst: PropTypes.array,
        ondernemers: PropTypes.object,
        aanmeldingen: PropTypes.object,
        voorkeuren: PropTypes.object,
        datum: PropTypes.string,
        type: PropTypes.string,
        user: PropTypes.object,
        toewijzingen: PropTypes.array.isRequired,
        algemenevoorkeuren: PropTypes.array,
    };

    render() {
        const {
            markt,
            aLijst,
            aanmeldingen,
            voorkeuren,
            datum,
            type,
            user,
            toewijzingen,
            algemenevoorkeuren,
        } = this.props;
        let { ondernemers } = this.props;
        const aLijstSollNummers = aLijst.map(ondernemer => ondernemer.sollicitatieNummer);
        const aLijstErkenningsNummers = aLijst.map(ondernemer => ondernemer.erkenningsnummer);
        const aLijstDay = A_LIJST_DAYS.includes(new Date(datum).getDay());

        const itemsOnPage = 40;
        const aLijstAangemeld = 0;
        const Aangemeld = 2;
        const aLijstNietAangemeld = 1;
        const NietAangemeld = 3;

        ondernemers = ondernemers.filter(
            ondernemer =>
                !toewijzingen.find(({ erkenningsNummer }) => erkenningsNummer === ondernemer.erkenningsNummer),
        );

        ondernemers = Ondernemers.sort(ondernemers, aLijst);
        ondernemers = [
            ...ondernemers.filter(ondernemer => Indeling.isAanwezig(datum, aanmeldingen, ondernemer)),
            ...ondernemers.filter(ondernemer => !Indeling.isAanwezig(datum, aanmeldingen, ondernemer)),
        ];
        const ondernemersErkenningsNummers = ondernemers.map(ondernemer => ondernemer.erkenningsNummer);
        const ondernemersRest = aLijstErkenningsNummers.filter(nr => !ondernemersErkenningsNummers.includes(nr));

        const ondernemersGrouped = ondernemers
            .reduce(
                (total, ondernemer) => {
                    total[
                        Indeling.isAanwezig(datum, aanmeldingen, ondernemer) &&
                        aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? aLijstAangemeld
                            : Indeling.isAanwezig(datum, aanmeldingen, ondernemer) &&
                              !aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? Aangemeld
                            : !Indeling.isAanwezig(datum, aanmeldingen, ondernemer) &&
                              aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? aLijstNietAangemeld
                            : !Indeling.isAanwezig(datum, aanmeldingen, ondernemer) &&
                              !aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? NietAangemeld
                            : NietAangemeld
                    ].push(ondernemer);

                    return total;
                },
                [[], [], [], []],
            )
            .map(group => paginate(paginate(group, itemsOnPage), 2));
        const titleBase = type === 'wenperiode' ? 'Sollicitanten' : 'Voorrangslijst';
        const titles = [
            `${titleBase} ${aLijstDay ? ', A lijst' : ''} aangemeld: ${markt.naam}`,
            `${titleBase} ${aLijstDay ? ', A lijst' : ''} niet aangemeld: ${markt.naam}`,
            `${titleBase} ${aLijstDay ? ', B lijst' : ''} aangemeld: ${markt.naam}`,
            `${titleBase} ${aLijstDay ? ', B lijst' : ''} niet aangemeld: ${markt.naam}`,
        ];
        const plaatsvoorkeuren = voorkeuren.reduce((t, voorkeur) => {
            if (!t[voorkeur.erkenningsNummer]) {
                t[voorkeur.erkenningsNummer] = [];
            }
            t[voorkeur.erkenningsNummer].push(voorkeur);

            return t;
        }, {});
        const algemenevoorkeurenObject = algemenevoorkeuren.reduce((t, voorkeur) => {
            t[voorkeur.erkenningsNummer] = voorkeur;
            return t;
        }, {});

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title={titleBase}
                markt={markt}
                datum={datum}
                type={type}
                buttonLabel={type === 'wenperiode' ? 'sollicitanten' : type}
                user={user}
                showDate={false}
            >
                {ondernemersGrouped.map((group, i) =>
                    group.length > 0
                        ? group.map((page, k) => (
                              <PrintPage
                                  key={k}
                                  title={`${titles[i]}${
                                      group.length > 1 ? ' (' + (k + 1) + ' - ' + group.length + ')' : ''
                                  }`}
                                  datum={datum}
                              >
                                  {page.map((list, j) => (
                                      <OndernemerList
                                          key={j}
                                          ondernemers={list}
                                          markt={markt}
                                          type={type}
                                          datum={datum}
                                          aanmeldingen={aanmeldingen}
                                          plaatsvoorkeuren={plaatsvoorkeuren}
                                          algemenevoorkeuren={algemenevoorkeurenObject}
                                      />
                                  ))}
                              </PrintPage>
                          ))
                        : null,
                )}
            </MarktDetailBase>
        );
    }
}

module.exports = VoorrangslijstPage;
